import React, { useState, useEffect } from 'react';
import type { Settings } from '../types';
import { CALCULATION_METHODS } from '../constants';
import { PlayIcon, LocationMarkerIcon, SpinnerIcon } from './Icons';

interface SettingsPanelProps {
  currentSettings: Settings;
  onSave: (newSettings: Settings) => void;
  loading: boolean;
  error: string | null;
}

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


const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentSettings, onSave, loading, error }) => {
  const [location, setLocation] = useState(`${currentSettings.city}, ${currentSettings.country}`);
  const [method, setMethod] = useState(currentSettings.method);
  const [is24Hour, setIs24Hour] = useState(currentSettings.is24HourFormat);
  const [showDuha, setShowDuha] = useState(currentSettings.showDuha);
  const [isHanafiAsr, setIsHanafiAsr] = useState(currentSettings.isHanafiAsr);
  const [showImsak, setShowImsak] = useState(currentSettings.showImsak);
  const [showMidnight, setShowMidnight] = useState(currentSettings.showMidnight);
  const [showSeconds, setShowSeconds] = useState(currentSettings.showSeconds);
  const [showCountdownSeconds, setShowCountdownSeconds] = useState(currentSettings.showCountdownSeconds);
  const [desktopNotifications, setDesktopNotifications] = useState(currentSettings.desktopNotifications ?? true);
  const [adhanPreNotification, setAdhanPreNotification] = useState(currentSettings.adhanPreNotification ?? 15);
  const [showAdhkar, setShowAdhkar] = useState(currentSettings.showAdhkar ?? true);
  const [showJumuah, setShowJumuah] = useState(currentSettings.showJumuah ?? true);
  const [showQiyam, setShowQiyam] = useState(currentSettings.showQiyam ?? false);
  const [geoStatus, setGeoStatus] = useState('');

  // Defensive fallback for theme
  const theme = currentSettings.theme || { mode: 'dark', fontSize: 'medium', fontFamily: 'modern' };

  useEffect(() => {
    setLocation(`${currentSettings.city}, ${currentSettings.country}`);
    setMethod(currentSettings.method);
    setIs24Hour(currentSettings.is24HourFormat);
    setShowDuha(currentSettings.showDuha);
    setIsHanafiAsr(currentSettings.isHanafiAsr);
    setShowImsak(currentSettings.showImsak);
    setShowMidnight(currentSettings.showMidnight);
    setShowSeconds(currentSettings.showSeconds);
    setShowCountdownSeconds(currentSettings.showCountdownSeconds);
    setDesktopNotifications(currentSettings.desktopNotifications ?? true);
    setAdhanPreNotification(currentSettings.adhanPreNotification ?? 15);
    setShowAdhkar(currentSettings.showAdhkar ?? true);
    setShowJumuah(currentSettings.showJumuah ?? true);
    setShowQiyam(currentSettings.showQiyam ?? false);
  }, [currentSettings]);

  // Clear local geo status message if a new API error comes in
  useEffect(() => {
    if (error) {
      setGeoStatus('');
    }
  }, [error])

  // Effect to auto-save settings that don't require a refetch
  useEffect(() => {
    const newSettings: Partial<Settings> = {};
    if (currentSettings.is24HourFormat !== is24Hour) {
      newSettings.is24HourFormat = is24Hour;
    }
    if (currentSettings.showDuha !== showDuha) {
      newSettings.showDuha = showDuha;
    }
    if (currentSettings.isHanafiAsr !== isHanafiAsr) {
      newSettings.isHanafiAsr = isHanafiAsr;
    }
    if (currentSettings.showImsak !== showImsak) {
      newSettings.showImsak = showImsak;
    }
    if (currentSettings.showMidnight !== showMidnight) {
      newSettings.showMidnight = showMidnight;
    }
    if (currentSettings.showSeconds !== showSeconds) {
      newSettings.showSeconds = showSeconds;
    }
    if (currentSettings.showCountdownSeconds !== showCountdownSeconds) {
      newSettings.showCountdownSeconds = showCountdownSeconds;
    }
    if (currentSettings.desktopNotifications !== desktopNotifications) {
      newSettings.desktopNotifications = desktopNotifications;
    }
    if (currentSettings.adhanPreNotification !== adhanPreNotification) {
      newSettings.adhanPreNotification = adhanPreNotification;
    }
    if (currentSettings.showAdhkar !== showAdhkar) {
      newSettings.showAdhkar = showAdhkar;
    }
    if (currentSettings.showJumuah !== showJumuah) {
      newSettings.showJumuah = showJumuah;
    }
    if (currentSettings.showQiyam !== showQiyam) {
      newSettings.showQiyam = showQiyam;
    }

    if (Object.keys(newSettings).length > 0) {
      onSave({ ...currentSettings, ...newSettings });
    }
  }, [is24Hour, showDuha, isHanafiAsr, showImsak, showMidnight, showSeconds, showCountdownSeconds, desktopNotifications, adhanPreNotification, showAdhkar, showJumuah, showQiyam, currentSettings, onSave]);


  const handleLocationSave = () => {
    const parts = location.split(',').map(p => p.trim());
    const city = parts[0] || '';
    const country = parts.length > 1 ? parts.slice(1).join(',').trim() : '';
    onSave({ ...currentSettings, city, country, method, is24HourFormat: is24Hour, isHanafiAsr });
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGeoStatus('Fetching location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`);
          if (!response.ok) {
            throw new Error('Failed to reverse geocode.');
          }
          const data = await response.json();

          const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || '';
          const country = data.address.country || '';

          if (city && country) {
            setLocation(`${city}, ${country}`);
            setGeoStatus('');
          } else {
            setGeoStatus('Could not determine city and country from your location.');
          }

        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setGeoStatus('Could not retrieve location name.');
        }
      },
      (error) => {
        let message = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'You denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'The request to get user location timed out.';
            break;
        }
        setGeoStatus(message);
      }
    );
  };

  return (
    <div className="flex flex-col h-full w-full space-y-4 text-right pb-8">
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
          الموقع
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeolocate}
            className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            title="Locate me"
          >
            <LocationMarkerIcon className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleLocationSave}
            className="p-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            title="Save Location"
          >
            <PlayIcon className="w-5 h-5 text-white transform rotate-180" />
          </button>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={handleLocationSave}
            className="flex-1 bg-gray-700 text-white border-transparent rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            placeholder="City, Country"
          />
        </div>
        {geoStatus && <p className="text-xs text-yellow-400 mt-1">{geoStatus}</p>}
      </div>

      {/* Calculation Method */}
      <div>
        <label htmlFor="method" className="block text-sm font-medium text-gray-300 mb-1">
          طريقة الحساب
        </label>
        <select
          id="method"
          value={method}
          onChange={(e) => {
            const newMethod = Number(e.target.value); // Ensure newMethod is a number
            setMethod(newMethod);
            onSave({ ...currentSettings, method: newMethod });
          }}
          dir="rtl"
          className="w-full bg-gray-700 text-white border-transparent rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
        >
          {CALCULATION_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500 text-center bg-red-900/20 p-2 rounded-md">{error}</p>}

      {/* Theme & Appearance */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold mb-1 text-center text-gray-400">المظهر والألوان</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Theme Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 text-center">السمة</label>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => onSave({ ...currentSettings, theme: { ...theme, mode: 'dark' } })}
                className={`w-24 p-1.5 rounded-md flex items-center justify-center gap-2 transition-all ${theme.mode === 'dark'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                <span>🌙</span>
                <span>داكن</span>
              </button>
              <button
                onClick={() => onSave({ ...currentSettings, theme: { ...theme, mode: 'light' } })}
                className={`w-24 p-1.5 rounded-md flex items-center justify-center gap-2 transition-all ${theme.mode === 'light'
                  ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                <span>☀️</span>
                <span>فاتح</span>
              </button>
            </div>
          </div>

          {/* Font Family Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 text-center">نوع الخط</label>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => onSave({ ...currentSettings, theme: { ...theme, fontFamily: 'modern' } })}
                className={`w-24 p-1.5 rounded-md text-sm transition-all ${theme.fontFamily === 'modern'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                عصري
              </button>
              <button
                onClick={() => onSave({ ...currentSettings, theme: { ...theme, fontFamily: 'naskh' } })}
                className={`w-24 p-1.5 rounded-md text-sm transition-all ${theme.fontFamily === 'naskh'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                نسخ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold mb-1 text-center text-gray-400">الإشعارات</h3>

        <div className="grid grid-cols-2 gap-2 mb-2" dir="rtl">
          <ToggleSwitch
            label="سطح المكتب"
            checked={desktopNotifications}
            onChange={(checked) => {
              setDesktopNotifications(checked);
              if (checked && 'Notification' in window && Notification.permission !== 'granted') {
                Notification.requestPermission();
              }
            }}
          />

          <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
            {/* <span className="text-white" >قبل الأذان:</span> */}
            <span className="text-white" dir="rtl">قبل الأذان <span dir="ltr">:</span></span>

            <div className="flex gap-1">
              {[5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setAdhanPreNotification(mins)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${adhanPreNotification === mins ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >
                  {mins}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2" dir="rtl">
          <ToggleSwitch
            label="الأذكار"
            checked={showAdhkar}
            onChange={setShowAdhkar}
          />
          <ToggleSwitch
            label="الجمعة"
            checked={showJumuah}
            onChange={setShowJumuah}
          />
          <ToggleSwitch
            label="القيام"
            checked={showQiyam}
            onChange={setShowQiyam}
          />
        </div>


      </div>

      {/* Options générales - Grid Layout for compactness */}
      <div className="space-y-2" dir="rtl">
        <h3 className="text-sm font-semibold mb-1 text-center text-gray-400">عام</h3>

        <div className="grid grid-cols-3 gap-x-2 gap-y-2">
          <ToggleSwitch
            label="العصر حنفي"
            checked={isHanafiAsr}
            onChange={setIsHanafiAsr}
          />

          <ToggleSwitch
            label="الضحى"
            checked={showDuha}
            onChange={setShowDuha}
          />

          <ToggleSwitch
            label="إمساك"
            checked={showImsak}
            onChange={setShowImsak}
          />

          <ToggleSwitch
            label="نصف الليل"
            checked={showMidnight}
            onChange={setShowMidnight}
          />

          <ToggleSwitch
            label="ثواني (س)"
            checked={showSeconds}
            onChange={setShowSeconds}
          />

          <ToggleSwitch
            label="ثواني (م)"
            checked={showCountdownSeconds}
            onChange={setShowCountdownSeconds}
          />

          <div className="hidden md:block"></div>
          <div className="hidden md:block"></div>

          <ToggleSwitch
            label="24/12 ساعة"
            checked={is24Hour}
            onChange={setIs24Hour}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;