import { useEffect, useRef, useCallback } from 'react';
import { Settings, PrayerTimes, Prayer } from '../types';
import { PRAYER_NAMES } from '../constants';
import iconUrl from '../icons/icon128.png';

interface UseNotificationsProps {
    settings: Settings;
    prayerTimes: PrayerTimes | null;
    nextPrayer: Prayer | null;
    currentTime: Date;
}

export const useNotifications = ({
    settings,
    prayerTimes,
    nextPrayer,
    currentTime,
}: UseNotificationsProps) => {
    const lastNotificationTime = useRef<number>(0);
    const notifiedPrayers = useRef<Set<string>>(new Set());

    // Request permission helper
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }, []);

    // Send notification helper
    const sendNotification = useCallback((title: string, body: string) => {
        if (Notification.permission === 'granted') {
            // Prevent duplicate notifications within 1 minute
            const now = Date.now();
            if (now - lastNotificationTime.current < 60000) {
                return;
            }

            new Notification(title, {
                body,
                icon: iconUrl,
                dir: 'rtl', // For Arabic support
            });
            lastNotificationTime.current = now;
        }
    }, []);

    // Check for Pre-Adhan Notifications
    useEffect(() => {
        if (!settings.desktopNotifications || !nextPrayer || !prayerTimes) return;

        const timeToNextPrayer = nextPrayer.time.getTime() - currentTime.getTime();
        const minutesToNextPrayer = Math.floor(timeToNextPrayer / 60000);
        const notificationKey = `pre-${nextPrayer.name}-${nextPrayer.time.toDateString()}-${settings.adhanPreNotification}`;

        if (
            minutesToNextPrayer === settings.adhanPreNotification &&
            !notifiedPrayers.current.has(notificationKey)
        ) {
            sendNotification(
                'اقتراب موعد الصلاة',
                `متبقي ${settings.adhanPreNotification} دقيقة على صلاة ${nextPrayer.name}`
            );
            notifiedPrayers.current.add(notificationKey);
        }
    }, [currentTime, nextPrayer, settings.desktopNotifications, settings.adhanPreNotification, sendNotification, prayerTimes]);

    // Check for Adhan Notifications
    useEffect(() => {
        if (!settings.desktopNotifications || !prayerTimes) return;

        // We rely on the main App's Adhan trigger logic usually, but for desktop notification:
        // We can check if any prayer time is NOW (within last minute)
        // However, to keep it simple and synced, we might just check current time vs prayer times

        // Implementation for Adhan Notification
        // This runs every second via currentTime update
        const now = currentTime.getTime();

        // Helper to check if time matches
        const checkPrayerTime = (prayerName: string, timeStr: string) => {
            if (!timeStr) return;
            const [h, m] = timeStr.split(':').map(Number);
            const prayerDate = new Date(currentTime);
            prayerDate.setHours(h, m, 0, 0);

            // If time is within the last minute
            if (now >= prayerDate.getTime() && now < prayerDate.getTime() + 60000) {
                const key = `adhan-${prayerName}-${prayerDate.toDateString()}`;
                if (!notifiedPrayers.current.has(key)) {
                    sendNotification('حان وقت الصلاة', `حان الآن موعد صلاة ${prayerName}`);
                    notifiedPrayers.current.add(key);
                }
            }
        };

        if (prayerTimes.fajr) checkPrayerTime('الفجر', prayerTimes.fajr);
        if (prayerTimes.dhuhr) checkPrayerTime('الظهر', prayerTimes.dhuhr);
        if (prayerTimes.asr) checkPrayerTime('العصر', prayerTimes.asr);
        if (prayerTimes.maghrib) checkPrayerTime('المغرب', prayerTimes.maghrib);
        if (prayerTimes.isha) checkPrayerTime('العشاء', prayerTimes.isha);

    }, [currentTime, prayerTimes, settings.desktopNotifications, sendNotification]);

    // Check for Adhkar Reminder (Post-Prayer)
    useEffect(() => {
        if (!settings.desktopNotifications || !settings.showAdhkar || !prayerTimes) return;

        const checkAdhkarTime = (prayerName: string, timeStr: string) => {
            if (!timeStr) return;
            const [h, m] = timeStr.split(':').map(Number);
            const prayerDate = new Date(currentTime);
            prayerDate.setHours(h, m, 0, 0);

            // 15 minutes after prayer
            const adhkarTime = prayerDate.getTime() + 15 * 60000;

            if (now >= adhkarTime && now < adhkarTime + 60000) {
                const key = `adhkar-${prayerName}-${prayerDate.toDateString()}`;
                if (!notifiedPrayers.current.has(key)) {
                    sendNotification('تذكير بالأذكار', `لا تنسى أذكار ما بعد صلاة ${prayerName}`);
                    notifiedPrayers.current.add(key);
                }
            }
        };

        const now = currentTime.getTime();
        if (prayerTimes.fajr) checkAdhkarTime('الفجر', prayerTimes.fajr);
        if (prayerTimes.dhuhr) checkAdhkarTime('الظهر', prayerTimes.dhuhr);
        if (prayerTimes.asr) checkAdhkarTime('العصر', prayerTimes.asr);
        if (prayerTimes.maghrib) checkAdhkarTime('المغرب', prayerTimes.maghrib);
        if (prayerTimes.isha) checkAdhkarTime('العشاء', prayerTimes.isha);

    }, [currentTime, prayerTimes, settings.desktopNotifications, settings.showAdhkar, sendNotification]);


    // Check for Jumu'ah Reminder
    useEffect(() => {
        if (!settings.desktopNotifications || !settings.showJumuah || !prayerTimes || !prayerTimes.dhuhr) return;

        // Check if today is Friday (5)
        if (currentTime.getDay() === 5) {
            const [h, m] = prayerTimes.dhuhr.split(':').map(Number);
            const dhuhrDate = new Date(currentTime);
            dhuhrDate.setHours(h, m, 0, 0);

            // 1 hour before Dhuhr
            const reminderTime = dhuhrDate.getTime() - 60 * 60000;
            const now = currentTime.getTime();

            if (now >= reminderTime && now < reminderTime + 60000) {
                const key = `jumuah-${dhuhrDate.toDateString()}`;
                if (!notifiedPrayers.current.has(key)) {
                    sendNotification('تذكير الجمعة', 'ساعة قبل صلاة الجمعة، بادر بالذهاب للمسجد وقراءة سورة الكهف');
                    notifiedPrayers.current.add(key);
                }
            }
        }
    }, [currentTime, prayerTimes, settings.desktopNotifications, settings.showJumuah, sendNotification]);

    // Check for Qiyam Reminder (Last Third of Night)
    useEffect(() => {
        if (!settings.desktopNotifications || !settings.showQiyam || !prayerTimes || !prayerTimes.maghrib || !prayerTimes.fajr) return;

        // Need tomorrow's Fajr for accurate calculation, but we can approximate or use logic if available
        // For simplicity, we'll calculate based on today's Maghrib and tomorrow's Fajr (assuming Fajr time is similar)
        // Or better, if we have tomorrow's Fajr passed in. 
        // The hook props only have `prayerTimes` which is `today`. 
        // We will assume Fajr tomorrow is same time as Fajr today for estimation if not available.

        const [maghribH, maghribM] = prayerTimes.maghrib.split(':').map(Number);
        const [fajrH, fajrM] = prayerTimes.fajr.split(':').map(Number);

        const maghribDate = new Date(currentTime);
        maghribDate.setHours(maghribH, maghribM, 0, 0);

        const fajrTomorrowDate = new Date(currentTime);
        fajrTomorrowDate.setDate(fajrTomorrowDate.getDate() + 1);
        fajrTomorrowDate.setHours(fajrH, fajrM, 0, 0);

        // If current time is past midnight but before Fajr, we are in the "night" of the previous day's Maghrib
        // But our logic runs continuously. 

        // Calculate duration
        const nightDuration = fajrTomorrowDate.getTime() - maghribDate.getTime();
        const lastThirdStart = maghribDate.getTime() + (nightDuration * 2 / 3);

        const now = currentTime.getTime();

        // Check if we are at the start of the last third
        if (now >= lastThirdStart && now < lastThirdStart + 60000) {
            const key = `qiyam-${maghribDate.toDateString()}`;
            if (!notifiedPrayers.current.has(key)) {
                sendNotification('قيام الليل', 'بدأ الثلث الأخير من الليل، وقت مبارك للدعاء والصلاة');
                notifiedPrayers.current.add(key);
            }
        }

    }, [currentTime, prayerTimes, settings.desktopNotifications, settings.showQiyam, sendNotification]);

    return { requestPermission };
};
