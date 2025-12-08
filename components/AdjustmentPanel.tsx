import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PrayerData, PrayerAdjustments, PrayerTimes, Settings, AdhanSettings } from '../types';
import { InfoIcon, MicrophoneIcon, PlayIcon, ChevronDownIcon } from './Icons';
import { ADHAN_SOUNDS } from '../constants';


interface AdjustmentPanelProps {
    prayerData: PrayerData | null;
    adjustments: PrayerAdjustments;
    onAdjustmentsChange: React.Dispatch<React.SetStateAction<PrayerAdjustments>>;
    is24HourFormat: boolean;
    settings: Settings;
    onSettingsChange: (newSettings: Settings) => void;
}

// --- Nouvelles icônes de volume ---
const VolumeUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

const VolumeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

// Fix: Add explicit type annotation to make properties optional, resolving the splice error.
const BASE_ADJUSTABLE_PRAYERS: { key: string; ar: string; hasInfo?: boolean; hasMic?: boolean }[] = [
    { key: 'imsak', ar: 'إمساك' },
    { key: 'fajr', ar: 'الفجر', hasMic: true },
    { key: 'shourouq', ar: 'الشروق' },
    { key: 'dhuhr', ar: 'الظهر', hasMic: true },
    { key: 'asr', ar: 'العصر', hasMic: true },
    { key: 'maghrib', ar: 'المغرب', hasMic: true },
    { key: 'isha', ar: 'العشاء', hasMic: true },
];

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
    <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
        <span className="text-white">{label}</span>
        <button
            onClick={() => onChange(!checked)}
            dir="ltr"
            className={`relative inline-flex items-center h-6 rounded-full w-11 p-1 transition-colors duration-300 ease-in-out ${checked ? 'bg-blue-500' : 'bg-gray-600'}`}
            aria-label={`Toggle ${label}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full shadow ring-0 transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const AdjustmentControl: React.FC<{ value: number, onChange: (newValue: number) => void }> = ({ value, onChange }) => {
    const isDefault = value === 0;
    return (
        <div className="flex items-center space-x-2">
            <button onClick={() => onChange(value - 1)} className="px-3 py-1 bg-gray-600 rounded-md hover:bg-gray-500">-</button>
            <span className={`w-10 text-center font-bold text-lg py-1 rounded-md ${isDefault ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}>
                {value}
            </span>
            <button onClick={() => onChange(value + 1)} className="px-3 py-1 bg-gray-600 rounded-md hover:bg-gray-500">+</button>
        </div>
    );
};


const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ prayerData, adjustments, onAdjustmentsChange, is24HourFormat, settings, onSettingsChange }) => {

    const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
    const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);
    const preMuteVolumeRef = useRef(settings.volume);

    const adjustablePrayers = useMemo(() => {
        return [...BASE_ADJUSTABLE_PRAYERS];
    }, []);

    useEffect(() => {
        // Cleanup function to stop audio when component unmounts
        return () => {
            if (playingAudio) {
                playingAudio.pause();
            }
        };
    }, [playingAudio]);

    useEffect(() => {
        // Effect to update volume in real-time if test audio is playing
        if (playingAudio) {
            playingAudio.volume = settings.volume;
        }
    }, [settings.volume, playingAudio]);

    const handleAdjustmentChange = (prayerKey: keyof PrayerAdjustments, newValue: number) => {
        onAdjustmentsChange(prev => ({
            ...prev,
            [prayerKey]: newValue,
        }));
    };

    const handlePlayTestAdhan = (soundName?: string) => {
        if (playingAudio) {
            playingAudio.pause();
            setPlayingAudio(null);
            return;
        }

        const nameToPlay = soundName || settings.adhanSound;
        const selectedSound = ADHAN_SOUNDS.find(s => s.name === nameToPlay);

        if (selectedSound) {
            const audio = new Audio(selectedSound.url);
            audio.volume = settings.volume;
            audio.onended = () => setPlayingAudio(null);
            audio.onerror = () => {
                console.error("Error playing test adhan.");
                setPlayingAudio(null);
            };
            audio.play().catch(e => {
                console.error("Error playing test Adhan:", e);
                setPlayingAudio(null);
            });
            setPlayingAudio(audio);
        }
    };

    const handleAdhanForPrayerToggle = (prayerKey: keyof AdhanSettings) => {
        onSettingsChange({
            ...settings,
            adhanFor: {
                ...settings.adhanFor,
                [prayerKey]: !settings.adhanFor[prayerKey],
            },
        });
    };

    const handleGlobalAdhanSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (playingAudio) {
            playingAudio.pause();
            playingAudio.currentTime = 0;
            setPlayingAudio(null);
        }
        onSettingsChange({ ...settings, adhanSound: e.target.value });
    };

    const handleSpecificAdhanSoundChange = (prayerKey: string, soundName: string) => {
        if (playingAudio) {
            playingAudio.pause();
            playingAudio.currentTime = 0;
            setPlayingAudio(null);
        }
        const newAdhanSounds = { ...(settings.adhanSounds || {}) };
        if (soundName === 'default') {
            delete newAdhanSounds[prayerKey];
        } else {
            newAdhanSounds[prayerKey] = soundName;
        }
        onSettingsChange({ ...settings, adhanSounds: newAdhanSounds });
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        onSettingsChange({ ...settings, volume: newVolume });
    };

    const handleMuteToggle = () => {
        const currentVolume = settings.volume;
        if (currentVolume > 0) {
            // Mute: save current volume and set to 0
            preMuteVolumeRef.current = currentVolume;
            onSettingsChange({ ...settings, volume: 0 });
        } else {
            // Unmute: restore previous volume, or a default if it was 0
            const volumeToRestore = preMuteVolumeRef.current > 0 ? preMuteVolumeRef.current : 0.1;
            onSettingsChange({ ...settings, volume: volumeToRestore });
        }
    };


    const createDateFromHHMM = (timeStr: string, date: Date, adjustmentMinutes: number = 0) => {
        const [h, m] = timeStr.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(h, m + adjustmentMinutes, 0, 0);
        return newDate;
    };
    const formatHHMM = (date: Date) => {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col flex-grow w-full space-y-2 text-right overflow-hidden">
            <h2 className="text-lg font-semibold text-center mb-1">إعدادات الأذان و التعديل </h2>

            <div className="space-y-2 border-b border-gray-700 pb-2 mb-1" dir="rtl">
                <ToggleSwitch
                    label="تفعيل الأذان"
                    checked={settings.isAdhanEnabled}
                    onChange={(newCheckedState) => onSettingsChange({ ...settings, isAdhanEnabled: newCheckedState })}
                />

                <div className="bg-gray-700 rounded-lg p-2 space-y-1">
                    <label htmlFor="volume" className="flex justify-between items-center text-right">
                        <span className="text-white">مستوى الصوت</span>
                        <span className="text-white text-sm font-mono">{Math.round(settings.volume * 100)}%</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button onClick={handleMuteToggle} disabled={!settings.isAdhanEnabled} className="disabled:opacity-50">
                            {settings.volume === 0 ? (
                                <VolumeOffIcon className="w-8 h-8 text-gray-400" />
                            ) : (
                                <VolumeUpIcon className="w-8 h-8 text-white" />
                            )}
                        </button>
                        <input
                            id="volume"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={settings.volume}
                            onChange={handleVolumeChange}
                            disabled={!settings.isAdhanEnabled}
                            className="w-full h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="adhanSound" className="block text-sm font-medium text-gray-300 mb-1">
                        صوت الأذان الافتراضي
                    </label>
                    <div className="flex items-center gap-2">
                        <select
                            id="adhanSound"
                            value={settings.adhanSound}
                            onChange={handleGlobalAdhanSoundChange}
                            dir="rtl"
                            className="w-full bg-gray-700 text-white border-transparent rounded-md p-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-right"
                        >
                            {ADHAN_SOUNDS.map((sound) => (
                                <option key={sound.name} value={sound.name}>
                                    {sound.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => handlePlayTestAdhan()}
                            className="p-1.5 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center w-[36px] h-[36px] flex-shrink-0"
                            aria-label="Play test Adhan"
                        >
                            <PlayIcon className="w-4 h-4 text-white flip-horizontal" />
                        </button>
                    </div>
                </div>
            </div>


            <div className="flex-grow space-y-1.5 overflow-y-auto pr-1" dir="rtl">
                {adjustablePrayers.map(({ key, ar, hasInfo, hasMic }) => {
                    const prayerKey = key as keyof PrayerAdjustments;

                    const originalPrayerTime: string | null = prayerData?.prayers.today[prayerKey as keyof PrayerTimes] ?? null;
                    const adjustment = (adjustments as any)[prayerKey] || 0;
                    const isExpanded = expandedPrayer === key;

                    let formattedTimeDisplay = '';

                    if (originalPrayerTime) {
                        const date = createDateFromHHMM(originalPrayerTime, new Date(), 0);
                        date.setMinutes(date.getMinutes() + adjustment);

                        if (is24HourFormat) {
                            formattedTimeDisplay = formatHHMM(date);
                        } else {
                            const hours = date.getHours();
                            const minutes = date.getMinutes();
                            const formattedHours = hours % 12 || 12;
                            formattedTimeDisplay = `${formattedHours}:${String(minutes).padStart(2, '0')}`;
                        }
                    }

                    const currentSound = settings.adhanSounds?.[key];

                    return (
                        <div key={key} className="bg-gray-800 rounded-lg px-3 py-1 flex flex-col">
                            <div className="flex justify-between items-center w-full">
                                {/* Left Side (will appear right in RTL) */}
                                <div
                                    className="flex items-center gap-2 text-right cursor-pointer flex-grow"
                                    onClick={() => hasMic && setExpandedPrayer(isExpanded ? null : key)}
                                >
                                    {hasInfo && <InfoIcon className="w-4 h-4 text-gray-400" />}
                                    <span className="text-sm text-gray-200 w-14 text-right">{ar}</span>
                                    {originalPrayerTime ? (
                                        <span className="text-base font-semibold text-white w-20 text-center">
                                            {formattedTimeDisplay}
                                        </span>
                                    ) : <span className="w-20"></span>}
                                    {hasMic && (
                                        <span className="text-xs text-gray-400 mr-2 flex items-center gap-1">
                                            {currentSound ? '🎵' : ''}
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </span>
                                    )}
                                </div>

                                {/* Right Side (will appear left in RTL) */}
                                <div className="flex items-center gap-3">
                                    <AdjustmentControl
                                        value={adjustment}
                                        onChange={(newValue) => handleAdjustmentChange(prayerKey, newValue)}
                                    />
                                    <div className="w-11">
                                        {hasMic && (
                                            <button
                                                onClick={() => handleAdhanForPrayerToggle(prayerKey as keyof AdhanSettings)}
                                                disabled={!settings.isAdhanEnabled}
                                                className="disabled:opacity-50 transition-colors"
                                                aria-label={`Toggle Adhan for ${ar}`}
                                            >
                                                <VolumeUpIcon className={`h-6 w-6 ${settings.adhanFor[prayerKey as keyof AdhanSettings] ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}`} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Sound Selection */}
                            {isExpanded && hasMic && (
                                <div className="mt-2 p-2 bg-gray-700/50 rounded-md animate-fadeIn">
                                    <label className="block text-xs text-gray-400 mb-1">تخصيص صوت الأذان ل{ar}</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={currentSound || 'default'}
                                            onChange={(e) => handleSpecificAdhanSoundChange(key, e.target.value)}
                                            className="flex-grow bg-gray-700 text-white text-sm rounded border border-gray-600 p-1 focus:border-blue-500 outline-none"
                                        >
                                            <option value="default">الافتراضي ({settings.adhanSound})</option>
                                            {ADHAN_SOUNDS.map(s => (
                                                <option key={s.name} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handlePlayTestAdhan(currentSound || settings.adhanSound)}
                                            className="p-1 bg-blue-600 rounded hover:bg-blue-700 text-white"
                                        >
                                            <PlayIcon className="w-3 h-3 transform rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdjustmentPanel;