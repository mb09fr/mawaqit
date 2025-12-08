export interface AdhanSettings {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface PrayerTimes {
  imsak: string;
  fajr: string;
  shourouq: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  duha?: string;
  midnight?: string;
}

export interface PrayerAdjustments {
  imsak: number;
  fajr: number;
  shourouq: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerData {
  hijri: string;
  date: string;
  prayers: {
    today: PrayerTimes;
    tomorrow: PrayerTimes;
  };
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  countdown: string;
  clockFace: string;
  clockHand: string;
  activePrayer: string;
}

export type ThemeMode = 'dark' | 'light' | 'mosque' | 'ramadan';

export interface ThemeSettings {
  mode: ThemeMode;
  customColors?: Partial<ThemeColors>;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'modern' | 'arabic' | 'naskh';
  backgroundImage?: string;
}

export interface Settings {
  city: string;
  country: string;
  method: number;
  is24HourFormat: boolean;
  isAdhanEnabled: boolean;
  adhanFor: AdhanSettings;
  adhanSound: string;
  adhanSounds?: Record<string, string>;
  volume: number;
  showDuha: boolean;
  isHanafiAsr: boolean;
  showImsak: boolean;
  showMidnight: boolean;
  showSeconds: boolean;
  showCountdownSeconds: boolean;
  theme: ThemeSettings;
  desktopNotifications: boolean;
  adhanPreNotification: number;
  showAdhkar: boolean;
  showJumuah: boolean;
  showQiyam: boolean;
}

export interface Prayer {
  name: string;
  time: Date;
}

export type ActiveView = 'main' | 'location' | 'adjustments' | 'qibla' | 'adhkar';