import React from 'react';
import type { PrayerTimes, AdhanSettings } from '../types';
import { VolumeIcon, VolumeOffIcon } from './Icons';

interface PrayerTimesGridProps {
  prayers: Partial<PrayerTimes>;
  activePrayerName: string | null;
  is24HourFormat: boolean;
  prayerNames: Array<{ en: string; ar: string }>;
  isAdhanEnabled: boolean;
  adhanSettings: AdhanSettings;
  onAdhanToggle: (prayerKey: string) => void;
}

const PrayerTimesGrid: React.FC<PrayerTimesGridProps> = ({ prayers, activePrayerName, is24HourFormat, prayerNames, isAdhanEnabled, adhanSettings, onAdhanToggle }) => {

  const renderPrayerItem = (prayerInfo: { en: string, ar: string }, useDenseLayout: boolean) => {
    const prayerKey = prayerInfo.en.toLowerCase() as keyof PrayerTimes;
    const prayerTime = prayers[prayerKey];

    if (!prayerTime) return <div key={prayerInfo.en}></div>;

    const isActive = activePrayerName === prayerInfo.ar;
    const showAdhanIcon = isAdhanEnabled && adhanSettings[prayerKey as keyof AdhanSettings];

    const getItemClasses = (isActive: boolean) => {
      const baseClasses = "flex flex-col items-center rounded-xl transition-all duration-300 ease-out relative overflow-hidden group";
      const layoutClasses = useDenseLayout ? 'p-2' : 'p-2';

      if (isActive) {
        return `${baseClasses} ${layoutClasses} bg-blue-500/20 backdrop-blur-md border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105 z-10`;
      }
      return `${baseClasses} ${layoutClasses} bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10`;
    };

    const nameFontSize = useDenseLayout ? 'text-xs' : 'text-sm';
    const timeFontSize = useDenseLayout ? 'text-sm' : 'text-base';
    const duhaTimeFontSize = 'text-xs';

    let formattedTime;
    let finalTimeFontSize = timeFontSize;

    if (prayerKey === 'duha') {
      formattedTime = <>{prayerTime}</>;
      finalTimeFontSize = duhaTimeFontSize;
    } else if (is24HourFormat) {
      formattedTime = <>{prayerTime}</>;
    } else {
      const [h, m] = prayerTime.split(':');
      const hours = parseInt(h, 10);
      const minutes = parseInt(m, 10);
      const ampm = hours >= 12 ? 'p' : 'a';
      const formattedHours = hours % 12 || 12;
      formattedTime = (
        <>
          {`${formattedHours}:${String(minutes).padStart(2, '0')}`}
          <sup className="text-[0.6em] opacity-70 ml-0.5">{ampm}</sup>
        </>
      );
    }

    return (
      <div key={prayerInfo.en} className={getItemClasses(isActive)}>
        {/* Active Indicator Dot */}
        {isActive && <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_5px_rgba(96,165,250,0.8)] animate-pulse"></div>}

        {/* Adhan Toggle Button - Moved to card corner for stability */}
        {isAdhanEnabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdhanToggle(prayerKey);
            }}
            className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors focus:outline-none z-20"
            aria-label={`Toggle Adhan for ${prayerInfo.en}`}
          >
            {adhanSettings[prayerKey as keyof AdhanSettings] ? (
              <VolumeIcon className="w-6 h-6 text-blue-300" />
            ) : (
              <VolumeOffIcon className="w-6 h-6 text-gray-400" />
            )}
          </button>
        )}

        <span className={`${nameFontSize} text-gray-300 mb-0.5 relative w-full text-center`}>
          {prayerInfo.ar}
        </span>
        <span className={`${finalTimeFontSize} font-medium text-white tracking-wider`} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formattedTime}
        </span>
      </div>
    );
  };

  if (prayerNames.length === 9) {
    const firstRowPrayers = prayerNames.slice(0, 4);
    const secondRowPrayers = prayerNames.slice(4);
    return (
      <div className="flex flex-col gap-1 w-full text-center" dir="rtl">
        <div className="grid grid-cols-4 gap-1">
          {firstRowPrayers.map(p => renderPrayerItem(p, true))}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {secondRowPrayers.map(p => renderPrayerItem(p, true))}
        </div>
      </div>
    );
  }

  const useDenseGrid = prayerNames.length > 6;
  const gridClasses = useDenseGrid
    ? "grid grid-cols-4 gap-1 w-full text-center"
    : "grid grid-cols-3 gap-1 w-full text-center";

  return (
    <div className={gridClasses} dir="rtl">
      {prayerNames.map((prayer) => renderPrayerItem(prayer, useDenseGrid))}
    </div>
  );
};

export default PrayerTimesGrid;