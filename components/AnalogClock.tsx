
import React from 'react';
import type { Prayer } from '../types';

interface AnalogClockProps {
  time: Date;
  activePrayer: Prayer | null;
  nextPrayer: Prayer | null;
  showSeconds: boolean;

}

const AnalogClock: React.FC<AnalogClockProps> = ({ time, activePrayer, nextPrayer, showSeconds }) => {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondHandRotation = seconds * 6;
  const minuteHandRotation = minutes * 6 + seconds * 0.1;
  const hourHandRotation = (hours % 12) * 30 + minutes * 0.5;

  const getArcPath = () => {
    if (!activePrayer || !nextPrayer) return '';

    const totalDuration = nextPrayer.time.getTime() - activePrayer.time.getTime();
    if (totalDuration <= 0) return '';

    const elapsedTime = time.getTime() - activePrayer.time.getTime();
    const progress = Math.min(1, elapsedTime / totalDuration);

    const startPrayerTime = activePrayer.time;
    const endPrayerTime = nextPrayer.time;

    const startHour = startPrayerTime.getHours() % 12 + startPrayerTime.getMinutes() / 60;
    const endHour = (endPrayerTime.getHours() % 12 + endPrayerTime.getMinutes() / 60);

    const startAngle = (startHour / 12) * 360 - 90;

    const totalAngle = (progress * (endPrayerTime.getTime() - startPrayerTime.getTime()) / (12 * 60 * 60 * 1000)) * 360 * 2;
    const finalAngle = startAngle + (progress * 360 * ((endPrayerTime.getTime() - startPrayerTime.getTime()) / (12 * 60 * 60 * 1000)));

    let durationHours = (endPrayerTime.getTime() - startPrayerTime.getTime()) / (1000 * 60 * 60);
    // Handle overnight case
    if (durationHours < 0) durationHours += 12;

    const sweepAngle = (durationHours / 12) * 360 * progress;
    const endAngle = startAngle + sweepAngle;

    const largeArcFlag = sweepAngle > 180 ? 1 : 0;

    const r = 45;
    const cx = 50;
    const cy = 50;

    const startX = cx + r * Math.cos(startAngle * Math.PI / 180);
    const startY = cy + r * Math.sin(startAngle * Math.PI / 180);
    const endX = cx + r * Math.cos(endAngle * Math.PI / 180);
    const endY = cy + r * Math.sin(endAngle * Math.PI / 180);

    return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  const timeFormatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  if (showSeconds) {
    timeFormatOptions.second = '2-digit';
  }


  return (
    <div className="relative w-52 h-52 flex items-center justify-center">
      {/* Glow effect behind the clock */}
      <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>

      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
        {/* Clock face background */}
        <circle cx="50" cy="50" r="48" fill="rgba(30, 41, 59, 0.5)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />

        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = i * 30;
          const isCardinal = i % 3 === 0;
          const r1 = 48;
          const r2 = isCardinal ? 42 : 45;
          const x1 = 50 + r1 * Math.sin(angle * Math.PI / 180);
          const y1 = 50 - r1 * Math.cos(angle * Math.PI / 180);
          const x2 = 50 + r2 * Math.sin(angle * Math.PI / 180);
          const y2 = 50 - r2 * Math.cos(angle * Math.PI / 180);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="white"
              strokeWidth={isCardinal ? "1.5" : "0.5"}
              strokeOpacity={isCardinal ? "0.8" : "0.4"}
              strokeLinecap="round"
            />
          );
        })}

        {/* Prayer time progress arc - subtle background */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

        {/* Active Prayer Progress Arc */}
        <path d={getArcPath()} stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" className="drop-shadow-[0_0_2px_rgba(96,165,250,0.5)]" />

        {/* Active Prayer Name */}
        <text x="50" y="32" textAnchor="middle" fill="white" fontSize="6" className="font-medium tracking-wide opacity-90" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {activePrayer?.name}
        </text>

        {/* Digital Time - Elegant & Floating */}
        <text x="50" y="75" textAnchor="middle" fill="white" fontSize="9" className="font-light tracking-widest" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {time.toLocaleTimeString('fr-FR', timeFormatOptions)}
        </text>

        {/* Hour Hand */}
        <line x1="50" y1="50" x2="50" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" transform={`rotate(${hourHandRotation} 50 50)`} className="drop-shadow-md" />

        {/* Minute Hand */}
        <line x1="50" y1="50" x2="50" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${minuteHandRotation} 50 50)`} className="drop-shadow-md" />

        {/* Second Hand - Accent Color */}
        <line x1="50" y1="50" x2="50" y2="14" stroke="#ef4444" strokeWidth="0.5" transform={`rotate(${secondHandRotation} 50 50)`} />
        <circle cx="50" cy="50" r="1.5" fill="#ef4444" />

      </svg>
    </div>
  );
};

export default AnalogClock;
