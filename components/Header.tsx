import React from 'react';
import { SettingsIcon, SlidersIcon, VolumeIcon, TimerIcon, VolumeOffIcon } from './Icons';
import { ActiveView } from '../types';

interface HeaderProps {
    currentTime: Date;
    onHomeClick: () => void;
    onLocationClick: () => void;
    onAdjustmentsClick: () => void;
    onAdhanToggle: () => void;
    onStopAdhan: () => void;
    activeView: ActiveView;
    city: string;
    is24HourFormat: boolean;
    isAdhanEnabled: boolean;
    isAdhanPlaying: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentTime, onHomeClick, onLocationClick, onAdjustmentsClick, onAdhanToggle, onStopAdhan, activeView, city, is24HourFormat, isAdhanEnabled, isAdhanPlaying }) => {
    const formatTime = (date: Date) => {
        if (is24HourFormat) {
            return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    };

    return (
        <header className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={onHomeClick}
                    className={`rounded-full p-1.5 flex items-center justify-center w-8 h-8 transition-all duration-300 ${activeView === 'main' ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                    aria-label="Go to home screen"
                >
                    <TimerIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={onLocationClick}
                    className={activeView === 'location' ? 'text-white' : 'text-gray-400 hover:text-white'}
                    aria-label="Location Settings"
                >
                    <SettingsIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={onAdjustmentsClick}
                    className={activeView === 'adjustments' ? 'text-white' : 'text-gray-400 hover:text-white'}
                    aria-label="Prayer Times Adjustments"
                >
                    <SlidersIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex items-center gap-3">
                {isAdhanPlaying && (
                    <button
                        onClick={onStopAdhan}
                        className="text-red-400 hover:text-red-300 transition-colors animate-pulse"
                        aria-label="Stop Adhan Sound"
                        title="Stop Adhan Sound"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 6h12v12H6z" />
                        </svg>
                    </button>
                )}
                <button
                    onClick={onAdhanToggle}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={isAdhanEnabled ? "Disable Adhan" : "Enable Adhan"}
                >
                    {isAdhanEnabled ? <VolumeIcon className="w-6 h-6" /> : <VolumeOffIcon className="w-6 h-6 text-gray-500" />}
                </button>
                <div className="bg-white/10 backdrop-blur-md border border-white/5 px-3 py-1 rounded-lg text-sm font-medium text-blue-100 tracking-wide">
                    {formatTime(currentTime)}
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/5 px-3 py-1 rounded-lg text-sm font-medium text-white tracking-wide truncate max-w-[120px]">
                    {city}
                </div>
            </div>
        </header>
    );
};

export default Header;