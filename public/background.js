// Background Service Worker for Mawaqit Prayer Times

// Constants
const ALARM_NAME = 'scheduledNotification';
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Adhan Sounds (Mirrored from constants.ts)
const ADHAN_SOUNDS = [
    { name: 'أذان مكة', url: 'https://www.islamcan.com/audio/adhan/azan1.mp3' },
    { name: 'أذان المدينة', url: 'https://www.islamcan.com/audio/adhan/azan2.mp3' },
    { name: 'أذان مشاري العفاسي', url: 'https://www.islamcan.com/audio/adhan/azan20.mp3' },
];

// Initialize on install or startup
chrome.runtime.onInstalled.addListener(scheduleNextAlarm);
chrome.runtime.onStartup.addListener(scheduleNextAlarm);

// Re-schedule when settings or prayer times change
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.settings || changes.prayerTimes)) {
        scheduleNextAlarm();
    }
});

// Handle Alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm fired:', alarm.name);
    if (alarm.name === ALARM_NAME) {
        // 1. Send the notification(s) due NOW
        checkAndSendNotifications();
        // 2. Schedule the NEXT alarm
        scheduleNextAlarm();
    }
});

// Handle Test Messages & Stop Requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TEST_NOTIFICATION') {
        console.log('Received test notification request');
        sendNotification('test-notification', 'Test Notification', 'This is a test notification from the background script.');
        sendResponse({ success: true });
    } else if (message.type === 'STOP_ADHAN') {
        console.log('Received stop adhan request');
        stopAdhan();
        sendResponse({ success: true });
    } else if (message.type === 'GET_AUDIO_STATUS') {
        checkAudioStatus().then(playing => sendResponse({ playing }));
        return true; // Keep channel open
    }
});

// Handle Notification Clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    console.log('Notification clicked:', notificationId);
    // If it's an Adhan notification (or any notification really), stop the sound
    stopAdhan();
    chrome.notifications.clear(notificationId);
});

async function checkAudioStatus() {
    const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });

    if (contexts.length === 0) return false;

    return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
            resolve(response && response.playing);
        });
    });
}

function scheduleNextAlarm() {
    chrome.storage.local.get(['settings', 'prayerTimes', 'prayerTimesTomorrow'], (result) => {
        const { settings, prayerTimes, prayerTimesTomorrow } = result;

        if (!settings || !prayerTimes || !settings.desktopNotifications) {
            chrome.alarms.clear(ALARM_NAME);
            return;
        }

        const now = Date.now();
        let triggers = getUpcomingTriggers(settings, prayerTimes, now);

        // If no triggers left for today, check tomorrow
        if (triggers.length === 0 && prayerTimesTomorrow) {
            console.log('No triggers for today, checking tomorrow...');
            // Create a date object for tomorrow (start of day)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            // Get triggers for tomorrow, starting from midnight
            const tomorrowTriggers = getUpcomingTriggers(settings, prayerTimesTomorrow, tomorrow.getTime());
            triggers = tomorrowTriggers;
        }

        if (triggers.length > 0) {
            // Sort by time
            triggers.sort((a, b) => a.time - b.time);

            const nextTrigger = triggers[0];

            // Schedule alarm
            chrome.alarms.create(ALARM_NAME, {
                when: nextTrigger.time
            });

            console.log(`Next alarm scheduled for: ${new Date(nextTrigger.time).toLocaleString()} (${nextTrigger.key})`);
        } else {
            console.log('No upcoming triggers found.');
        }
    });
}

function checkAndSendNotifications() {
    console.log('Checking for notifications...');
    chrome.storage.local.get(['settings', 'prayerTimes'], (result) => {
        const { settings, prayerTimes } = result;
        if (!settings || !prayerTimes || !settings.desktopNotifications) {
            console.log('Settings or prayerTimes missing, or notifications disabled.');
            return;
        }

        const now = Date.now();
        // Check for triggers that are due (or slightly past due within 10 mins)
        const triggers = getUpcomingTriggers(settings, prayerTimes, now - 10 * 60000);
        console.log(`Found ${triggers.length} potential triggers.`);

        triggers.forEach(trigger => {
            const diff = Math.abs(now - trigger.time);
            console.log(`Trigger: ${trigger.key}, Time: ${new Date(trigger.time).toLocaleTimeString()}, Diff: ${diff}ms`);

            // If the trigger time is effectively NOW (within widened window)
            if (diff < 10 * 60000) {
                console.log('Sending notification for:', trigger.key);
                sendNotification(trigger.key, trigger.title, trigger.message);

                // Check if it's an Adhan trigger and play audio
                if (trigger.key.startsWith('adhan-') && settings.isAdhanEnabled) {
                    playAdhan(settings, trigger.key);
                }
            }
        });
    });
}

async function playAdhan(settings, key) {
    // Determine sound URL
    let soundName = settings.adhanSound;
    // Extract prayer name from key (adhan-Fajr -> Fajr) - but key is adhan-Name-Date
    // The key format in getUpcomingTriggers is `adhan-${p.name}` (Arabic name)
    // But settings.adhanSounds uses English keys (fajr, dhuhr...)
    // This mapping is tricky without the full PRAYER_NAMES object.
    // Let's rely on the default sound for now or try to map if possible.
    // Ideally we should store the English key in the trigger too.

    // Simple fallback: use selected global sound
    const selectedSound = ADHAN_SOUNDS.find(s => s.name === soundName) || ADHAN_SOUNDS[0];
    const url = selectedSound.url;
    const volume = settings.volume || 1.0;

    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
    chrome.runtime.sendMessage({
        type: 'PLAY_AUDIO',
        url: url,
        volume: volume
    });
}

async function stopAdhan() {
    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
    chrome.runtime.sendMessage({
        type: 'STOP_AUDIO'
    });
}

async function setupOffscreenDocument(path) {
    // Check if offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(path)]
    });

    if (existingContexts.length > 0) {
        return;
    }

    // Create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'Playing Adhan audio in background',
        });
        await creating;
        creating = null;
    }
}
let creating; // Promise keeper to prevent race conditions

function getUpcomingTriggers(settings, prayerTimes, fromTime) {
    const triggers = [];
    const now = new Date(fromTime);

    // Helper to add trigger
    const addTrigger = (time, key, title, message) => {
        if (time > fromTime) {
            triggers.push({ time, key, title, message });
        }
    };

    // 1. Adhan & Pre-Adhan & Adhkar
    const prayers = [
        { name: 'الفجر', time: prayerTimes.fajr },
        { name: 'الظهر', time: prayerTimes.dhuhr },
        { name: 'العصر', time: prayerTimes.asr },
        { name: 'المغرب', time: prayerTimes.maghrib },
        { name: 'العشاء', time: prayerTimes.isha }
    ];

    prayers.forEach(p => {
        if (!p.time) return;
        const [h, m] = p.time.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(h, m, 0, 0);

        // Adhan
        addTrigger(prayerDate.getTime(), `adhan-${p.name}`, 'حان وقت الصلاة', `حان الآن موعد صلاة ${p.name}`);

        // Pre-Adhan
        if (settings.adhanPreNotification) {
            const preTime = prayerDate.getTime() - (settings.adhanPreNotification * 60000);
            addTrigger(preTime, `pre-${p.name}`, 'اقتراب موعد الصلاة', `متبقي ${settings.adhanPreNotification} دقيقة على صلاة ${p.name}`);
        }

        // Adhkar
        if (settings.showAdhkar) {
            const adhkarTime = prayerDate.getTime() + (15 * 60000);
            addTrigger(adhkarTime, `adhkar-${p.name}`, 'تذكير بالأذكار', `لا تنسى أذكار ما بعد صلاة ${p.name}`);
        }
    });

    // 2. Jumu'ah
    if (settings.showJumuah && now.getDay() === 5 && prayerTimes.dhuhr) {
        const [h, m] = prayerTimes.dhuhr.split(':').map(Number);
        const dhuhrDate = new Date(now);
        dhuhrDate.setHours(h, m, 0, 0);
        const reminderTime = dhuhrDate.getTime() - (60 * 60000);

        addTrigger(reminderTime, 'jumuah', 'تذكير الجمعة', 'ساعة قبل صلاة الجمعة، بادر بالذهاب للمسجد وقراءة سورة الكهف');
    }

    return triggers;
}

function sendNotification(key, title, message) {
    chrome.notifications.create(key + '-' + Date.now(), { // Unique ID to force new notification
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: title,
        message: message,
        priority: 2
    });
}
