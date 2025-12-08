import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import AnalogClock from './components/AnalogClock';
import DateDisplay from './components/DateDisplay';
import PrayerTimesGrid from './components/PrayerTimesGrid';
import SettingsPanel from './components/SettingsPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import { ThemeProvider } from './context/ThemeContext';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useNotifications } from './hooks/useNotifications';
import type { Prayer, PrayerData, Settings, ActiveView, PrayerAdjustments, PrayerTimes, AdhanSettings } from './types';
import { PRAYER_NAMES, ADHAN_SOUNDS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [settings, setSettings] = useState<Settings>(() => { // This function runs only on initial render
    const defaultSettings: Settings = {
      city: 'Taher',
      country: 'Algérie',
      method: 10, // Default to Algerian Ministry of Religious Affairs
      is24HourFormat: true,
      isAdhanEnabled: true,
      adhanFor: {
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
      },
      adhanSound: ADHAN_SOUNDS[0].name,
      adhanSounds: {},
      volume: 0.1,
      showDuha: false,
      isHanafiAsr: false,
      showImsak: false,
      showMidnight: false,
      showSeconds: true,
      showCountdownSeconds: true,
      theme: {
        mode: 'dark',
        fontSize: 'small',
        fontFamily: 'modern',
      },
      desktopNotifications: true,
      adhanPreNotification: 15,
      showAdhkar: true,
      showJumuah: true,
      showQiyam: false,
    };

    try {
      const savedSettings = localStorage.getItem('prayerSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge to ensure new settings from code updates are included
        // Deep merge theme to ensure all properties exist
        const mergedTheme = {
          ...defaultSettings.theme,
          ...(typeof parsed.theme === 'object' ? parsed.theme : {}),
          fontSize: 'small' as const // Force small font size
        };
        return { ...defaultSettings, ...parsed, theme: mergedTheme };
      }
    } catch (error) {
      console.error("Could not load settings from local storage, using defaults.", error);
    }
    return defaultSettings; // Return defaults if nothing saved or error
  });

  const [adjustments, setAdjustments] = useState<PrayerAdjustments>(() => {
    const defaultAdjustments: PrayerAdjustments = {
      imsak: 0, fajr: 0, shourouq: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
    };
    try {
      const savedAdjustments = localStorage.getItem('prayerTimeAdjustments');
      return savedAdjustments ? { ...defaultAdjustments, ...JSON.parse(savedAdjustments) } : defaultAdjustments;
    } catch (error) {
      console.error("Could not load adjustments from local storage, using defaults.", error);
    }
    return defaultAdjustments;
  });

  const [activeAdhanAudio, setActiveAdhanAudio] = useState<HTMLAudioElement | null>(null);
  const [playedAdhans, setPlayedAdhans] = useState(new Set<string>());

  useEffect(() => {
    try {
      localStorage.setItem('prayerTimeAdjustments', JSON.stringify(adjustments));
    } catch (error) {
      console.error("Could not save adjustments to local storage", error);
    }
  }, [adjustments]);

  useEffect(() => {
    try {
      localStorage.setItem('prayerSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Could not save settings to local storage", error);
    }
  }, [settings]);

  const { prayerData, loading, error } = usePrayerTimes(settings);
  const currentTime = useCurrentTime();



  const [activePrayer, setActivePrayer] = useState<Prayer | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);

  // Sync settings and prayer times to chrome.storage for background worker
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        settings: settings,
        prayerTimes: prayerData?.prayers.today || null,
        prayerTimesTomorrow: prayerData?.prayers.tomorrow || null,
        nextPrayer: nextPrayer // Optional: might be useful
      }, () => {
        // console.log('Data synced to chrome.storage');
      });
    }
  }, [settings, prayerData, nextPrayer]);

  // Initialize Notifications
  useNotifications({
    settings,
    prayerTimes: prayerData?.prayers.today || null,
    nextPrayer,
    currentTime,
  });

  const handleSettingsSave = (newSettings: Settings) => {
    if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
      setSettings(newSettings);
    }
  };

  const [isBackgroundAudioPlaying, setIsBackgroundAudioPlaying] = useState(false);

  // Poll for background audio status
  useEffect(() => {
    const checkStatus = () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_AUDIO_STATUS' }, (response) => {
          if (response) {
            setIsBackgroundAudioPlaying(response.playing);
          }
        });
      }
    };

    checkStatus(); // Check immediately
    const interval = setInterval(checkStatus, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  const handleAdhanToggle = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      isAdhanEnabled: !prevSettings.isAdhanEnabled
    }));
  };

  const handleStopAdhan = () => {
    // Stop local audio if playing
    if (activeAdhanAudio) {
      activeAdhanAudio.pause();
      activeAdhanAudio.currentTime = 0;
      setActiveAdhanAudio(null);
    }

    // Stop background audio
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'STOP_ADHAN' }, (response) => {
        console.log('Stop Adhan response:', response);
        setIsBackgroundAudioPlaying(false); // Optimistic update
      });
    }
  };

  const adjustedPrayersToday = useMemo(() => {
    if (!prayerData?.prayers.today || !prayerData?.prayers.tomorrow) return {} as PrayerTimes;

    const adjusted: Partial<PrayerTimes> = {};
    const todayPrayers = prayerData.prayers.today;

    const createDateFromHHMM = (timeStr: string, date: Date, adjustmentMinutes: number = 0) => {
      const [h, m] = timeStr.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(h, m + adjustmentMinutes, 0, 0);
      return newDate;
    };

    const formatHHMM = (date: Date) => {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    // First, calculate all adjusted base prayer times
    (Object.keys(todayPrayers) as Array<keyof PrayerTimes>).forEach(key => {
      const originalTime = todayPrayers[key];
      if (originalTime) {
        const adjustment = (adjustments as any)[key] || 0;
        const date = createDateFromHHMM(originalTime, new Date(), adjustment);
        adjusted[key] = formatHHMM(date);
      }
    });

    // Then, calculate Duha if enabled, based on adjusted times
    if (settings.showDuha && adjusted.shourouq && adjusted.dhuhr) {
      const shourouqDate = createDateFromHHMM(adjusted.shourouq, new Date());
      const dhuhrDate = createDateFromHHMM(adjusted.dhuhr, new Date());

      const duhaStartDate = new Date(shourouqDate.getTime() + 15 * 60000);
      const duhaEndDate = new Date(dhuhrDate.getTime() - 10 * 60000);

      adjusted.duha = `${formatHHMM(duhaStartDate)} - ${formatHHMM(duhaEndDate)}`;
    }

    // Then, calculate Midnight if enabled
    if (settings.showMidnight && prayerData.prayers.today.maghrib && prayerData.prayers.tomorrow.fajr) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const maghribDate = createDateFromHHMM(prayerData.prayers.today.maghrib, today, adjustments.maghrib || 0);
      const fajrTomorrowDate = createDateFromHHMM(prayerData.prayers.tomorrow.fajr, tomorrow, adjustments.fajr || 0);

      const midpointTime = maghribDate.getTime() + (fajrTomorrowDate.getTime() - maghribDate.getTime()) / 2;
      const midnightDate = new Date(midpointTime);

      adjusted.midnight = formatHHMM(midnightDate);
    }


    return adjusted as PrayerTimes;
  }, [prayerData, adjustments, settings.showDuha, settings.showMidnight]);


  const prayerSchedule = useMemo(() => {
    if (!prayerData) return [];

    const today = new Date();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const createPrayerDate = (prayerTime: string, date: Date, adjustment: number = 0): Date => {
      const [hours, minutes] = prayerTime.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes + adjustment, 0, 0);
      return newDate;
    };

    const schedule: Prayer[] = [];

    PRAYER_NAMES.forEach(prayerName => {
      const prayerKey = prayerName.en.toLowerCase() as keyof PrayerTimes;
      const prayerTime = prayerData.prayers.today[prayerKey];
      if (prayerTime) {
        const adjustment = (adjustments as any)[prayerKey] || 0;
        schedule.push({
          name: prayerName.ar,
          time: createPrayerDate(prayerTime, today, adjustment)
        });
      }
    });

    if (settings.showMidnight && adjustedPrayersToday.midnight) {
      const midnightTime = adjustedPrayersToday.midnight;
      // Midnight can be on the same day or the next day depending on calculation
      const midnightDate = createPrayerDate(midnightTime, today, 0);
      if (midnightDate < schedule[schedule.length - 1].time) { // if midnight is before isha today
        midnightDate.setDate(midnightDate.getDate() + 1); // it must be for the next day
      }
      schedule.push({ name: 'نصف الليل', time: midnightDate });
    }

    const fajrTomorrowTime = prayerData.prayers.tomorrow?.fajr;
    if (fajrTomorrowTime) {
      const fajrTomorrowAdjustment = adjustments.fajr || 0;
      schedule.push({
        name: "الفجر",
        time: createPrayerDate(fajrTomorrowTime, tomorrow, fajrTomorrowAdjustment)
      });
    }

    return schedule.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [prayerData, adjustments, settings.showMidnight, adjustedPrayersToday.midnight]);

  // Effect to play Adhan
  useEffect(() => {
    if (!settings.isAdhanEnabled || prayerSchedule.length === 0) {
      return;
    }

    const now = currentTime.getTime();

    prayerSchedule.forEach((prayer) => {
      const prayerInfo = PRAYER_NAMES.find(p => p.ar === prayer.name);
      if (prayerInfo) {
        const prayerKey = prayerInfo.en.toLowerCase() as keyof AdhanSettings;

        if (settings.adhanFor[prayerKey]) {
          const prayerTime = prayer.time.getTime();
          const uniquePrayerKey = `${prayer.name}-${prayer.time.toDateString()}`;

          // Play Adhan if the prayer time has passed within the last minute
          if (now >= prayerTime && now - prayerTime < 60000 && !playedAdhans.has(uniquePrayerKey)) {
            console.log(`Playing Adhan for ${prayer.name}`);

            // Determine which sound to play
            let soundName = settings.adhanSound;
            if (settings.adhanSounds && settings.adhanSounds[prayerKey]) {
              soundName = settings.adhanSounds[prayerKey];
            }

            const selectedSound = ADHAN_SOUNDS.find(s => s.name === soundName) || ADHAN_SOUNDS[0];
            const audio = new Audio(selectedSound.url);
            audio.volume = settings.volume;
            audio.onended = () => setActiveAdhanAudio(null);
            audio.onerror = (e) => {
              console.error("Error playing Adhan:", e);
              setActiveAdhanAudio(null);
            };
            audio.play().catch(e => {
              console.error("Error playing Adhan:", e);
              setActiveAdhanAudio(null);
            });

            setActiveAdhanAudio(audio);
            setPlayedAdhans(prev => new Set(prev).add(uniquePrayerKey));
          }
        }
      }
    });

  }, [currentTime, prayerSchedule, settings.isAdhanEnabled, settings.adhanSound, playedAdhans, settings.volume, settings.adhanFor]);

  // Effect to update live Adhan volume in real-time
  useEffect(() => {
    if (activeAdhanAudio) {
      activeAdhanAudio.volume = settings.volume;
    }
  }, [settings.volume, activeAdhanAudio]);

  // Reset played adhans for a new day
  useEffect(() => {
    if (prayerData) {
      const todayStr = new Date().toDateString();
      const newPlayedAdhans = new Set<string>();
      playedAdhans.forEach(key => {
        if (key.endsWith(todayStr)) {
          newPlayedAdhans.add(key);
        }
      });
      setPlayedAdhans(newPlayedAdhans);
    }
  }, [prayerData]);




  useEffect(() => {
    if (prayerSchedule.length > 0) {
      const now = currentTime.getTime();

      let nextPrayerIndex = prayerSchedule.findIndex(p => p.time.getTime() > now);

      if (nextPrayerIndex === -1) { // After last prayer of the day (Isha)
        const ishaToday = prayerSchedule.find(p => p.name === 'العشاء' && p.time.getDate() === new Date().getDate());
        const fajrTomorrow = prayerSchedule.find(p => p.name === 'الفجر' && p.time.getDate() !== new Date().getDate());
        setActivePrayer(ishaToday || prayerSchedule[prayerSchedule.length - 2]);
        setNextPrayer(fajrTomorrow || prayerSchedule[prayerSchedule.length - 1]);
      } else {
        const activePrayerIndex = (nextPrayerIndex === 0)
          // Before Fajr, active is Isha of yesterday, but schedule only has today. Find last prayer of schedule.
          ? prayerSchedule.length - 2 // This assumes Fajr tomorrow is last item
          : nextPrayerIndex - 1;
        setActivePrayer(prayerSchedule[activePrayerIndex]);
        setNextPrayer(prayerSchedule[nextPrayerIndex]);
      }
    }
  }, [currentTime, prayerSchedule]);

  const timeToNextPrayer = useMemo(() => {
    if (!nextPrayer) return 0;
    return Math.max(0, nextPrayer.time.getTime() - currentTime.getTime());
  }, [currentTime, nextPrayer]);

  const timeSinceActivePrayer = useMemo(() => {
    if (!activePrayer) return 0;
    return Math.max(0, currentTime.getTime() - activePrayer.time.getTime());
  }, [currentTime, activePrayer]);

  const countdownLabel = useMemo(() => {
    if (!nextPrayer) {
      return 'الوقت المتبقي';
    }
    if (nextPrayer.name === 'الشروق') {
      return 'الوقت المتبقي للشروق';
    }
    if (nextPrayer.name === 'نصف الليل') {
      return 'الوقت المتبقي لنصف الليل';
    }
    return `الوقت المتبقي لصلاة ${nextPrayer.name}`;
  }, [nextPrayer]);

  const renderCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const separatorClass = "text-4xl opacity-80 pb-1";
    const smallDigitClass = "text-4xl pb-1";
    const smallDigitClass2 = "text-3xl pb-1";
    const bigDigitClass = "text-7xl";

    if (!settings.showCountdownSeconds) {
      if (hours > 0) {
        return (
          <div className="flex items-baseline justify-center gap-1" dir="ltr">
            <span className={bigDigitClass}>{hours}</span>
            <span className={separatorClass}>:</span>
            <span className={smallDigitClass}>{pad(minutes)}</span>
          </div>
        );
      }
      return <span className={bigDigitClass}>{minutes}<span className="text-2xl ml-2 align-middle">د</span></span>;
    }

    if (hours > 0) {
      return (
        <div className="flex items-baseline justify-center gap-1" dir="ltr">
          <span className={bigDigitClass}>{hours}</span>
          <span className={separatorClass}>:</span>
          <span className={smallDigitClass}>{pad(minutes)}</span>
          <span className={separatorClass}>:</span>
          <span className={smallDigitClass2}>{pad(seconds)}</span>
        </div>
      );
    }

    return (
      <div className="flex items-baseline justify-center gap-1" dir="ltr">
        <span className={bigDigitClass}>{pad(minutes)}</span>
        <span className={separatorClass}>:</span>
        <span className={smallDigitClass2}>{pad(seconds)}</span>
      </div>
    );
  };

  const formatElapsedTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = totalSeconds % 3600;
    return `${hours}:${String(Math.floor(minutes / 60)).padStart(2, '0')}`;
  };

  const displayedPrayerNames = useMemo(() => {
    return [...PRAYER_NAMES];
  }, []);

  const renderContent = () => {
    if (activeView === 'location') {
      return (
        <SettingsPanel
          currentSettings={settings}
          onSave={handleSettingsSave}
          loading={loading}
          error={error}
        />
      );
    }
    if (activeView === 'adjustments') {
      return (
        <AdjustmentPanel
          prayerData={prayerData}
          adjustments={adjustments}
          onAdjustmentsChange={setAdjustments}
          is24HourFormat={settings.is24HourFormat}
          settings={settings}
          onSettingsChange={handleSettingsSave}
        />
      );
    }

    if (loading && !prayerData) {
      return <div className="flex-grow flex items-center justify-center h-full text-white">Loading Prayer Times...</div>;
    }
    if (error && !prayerData) {
      return <div className="flex-grow flex items-center justify-center h-full text-red-500 p-4 text-center">Error: {error}</div>;
    }
    if (!prayerData) {
      return <div className="flex-grow flex items-center justify-center h-full text-gray-400">Could not load prayer times.</div>;
    }

    return (
      <div className="flex-grow flex flex-col items-center justify-start gap-0">
        <AnalogClock time={currentTime} activePrayer={activePrayer} nextPrayer={nextPrayer} showSeconds={settings.showSeconds} />
        <div className="text-center w-full mt-0" dir="rtl">
          <p className="text-sm text-blue-200/80 uppercase tracking-widest mb-0.5 font-medium">{countdownLabel}</p>

          <div className="flex items-center justify-between w-full px-4">
            {/* Right Side (RTL Start) - Midnight */}
            <div className="flex flex-col gap-2 w-24">
              {settings.showMidnight && adjustedPrayersToday.midnight && (
                <div className="bg-white/5 rounded-lg p-2 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-gray-400 mb-1">نصف الليل</div>
                  <div className="text-lg font-mono text-white">{adjustedPrayersToday.midnight}</div>
                </div>
              )}
            </div>

            {/* Center - Countdown */}
            <div className="flex flex-col items-center">
              <div className="font-light tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {renderCountdown(timeToNextPrayer)}
              </div>
              <div className="inline-flex items-center justify-center mt-1 px-2 py-0.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-[10px] text-gray-300">
                <span className="opacity-70">الوقت المنقضي</span>
                <span className="mx-1 opacity-50">|</span>
                <span className="font-mono">{formatElapsedTime(timeSinceActivePrayer)}</span>
              </div>
            </div>

            {/* Left Side (RTL End) - Imsak & Duha */}
            <div className="flex flex-col gap-2 w-24">
              {settings.showImsak && adjustedPrayersToday.imsak && (
                <div className="bg-white/5 rounded-lg p-2 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-gray-400 mb-1">إمساك</div>
                  <div className="text-lg font-mono text-white">{adjustedPrayersToday.imsak}</div>
                </div>
              )}
              {settings.showDuha && adjustedPrayersToday.duha && (
                <div className="bg-white/5 rounded-lg p-2 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-gray-400 mb-1">الضحى</div>
                  <div className="text-[10px] font-mono text-white whitespace-nowrap">{adjustedPrayersToday.duha}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <DateDisplay hijri={prayerData.hijri} gregorian={prayerData.date} currentTime={currentTime} />
        <PrayerTimesGrid
          prayers={adjustedPrayersToday}
          activePrayerName={activePrayer?.name}
          is24HourFormat={settings.is24HourFormat}
          prayerNames={displayedPrayerNames}
          isAdhanEnabled={settings.isAdhanEnabled}
          adhanSettings={settings.adhanFor}
          onAdhanToggle={(prayerKey) => {
            setSettings(prev => ({
              ...prev,
              adhanFor: {
                ...prev.adhanFor,
                [prayerKey]: !prev.adhanFor[prayerKey as keyof AdhanSettings]
              }
            }));
          }}
        />
      </div>
    );
  };

  return (
    <ThemeProvider
      themeSettings={settings.theme}
      onThemeChange={(newTheme) => setSettings(prev => ({ ...prev, theme: newTheme }))}
    >
      <div className="app-container flex flex-col h-full p-2">
        <Header
          currentTime={currentTime}
          activeView={activeView}
          onHomeClick={() => setActiveView('main')}
          onLocationClick={() => setActiveView(prev => prev === 'location' ? 'main' : 'location')}
          onAdjustmentsClick={() => setActiveView(prev => prev === 'adjustments' ? 'main' : 'adjustments')}
          city={settings.city}
          is24HourFormat={settings.is24HourFormat}
          isAdhanEnabled={settings.isAdhanEnabled}
          onAdhanToggle={handleAdhanToggle}
          onStopAdhan={handleStopAdhan}
          isAdhanPlaying={!!activeAdhanAudio || isBackgroundAudioPlaying}
        />
        {renderContent()}
      </div>
    </ThemeProvider>
  );
};

export default App;