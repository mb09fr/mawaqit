import type { ThemeColors, ThemeMode } from '../types';

export const darkTheme: ThemeColors = {
    primary: '#1E88E5',
    secondary: '#42A5F5',
    background: '#2C2F33',
    surface: '#383B40',
    surfaceVariant: '#4A4D52',
    text: '#FFFFFF',
    textSecondary: '#B0B3B8',
    border: '#4A4A4A',
    accent: '#64B5F6',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    countdown: '#DC3545',
    clockFace: '#4A4A4A',
    clockHand: '#FFFFFF',
    activePrayer: '#1E88E5',
};

export const lightTheme: ThemeColors = {
    primary: '#1976D2',
    secondary: '#42A5F5',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#E0E0E0',
    text: '#212121',
    textSecondary: '#757575',
    border: '#BDBDBD',
    accent: '#2196F3',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    countdown: '#C62828',
    clockFace: '#EEEEEE',
    clockHand: '#212121',
    activePrayer: '#1976D2',
};

export const mosqueTheme: ThemeColors = {
    primary: '#2E7D32',
    secondary: '#66BB6A',
    background: '#1B5E20',
    surface: '#2E7D32',
    surfaceVariant: '#388E3C',
    text: '#FFFFFF',
    textSecondary: '#C8E6C9',
    border: '#4CAF50',
    accent: '#81C784',
    error: '#EF5350',
    success: '#A5D6A7',
    warning: '#FFB74D',
    countdown: '#F44336',
    clockFace: '#388E3C',
    clockHand: '#E8F5E9',
    activePrayer: '#66BB6A',
};

export const ramadanTheme: ThemeColors = {
    primary: '#D4AF37',
    secondary: '#F4E04D',
    background: '#1A1A2E',
    surface: '#2D2D44',
    surfaceVariant: '#3E3E58',
    text: '#F5F5DC',
    textSecondary: '#D4C5A9',
    border: '#D4AF37',
    accent: '#FFD700',
    error: '#FF6B6B',
    success: '#4ECDC4',
    warning: '#FFA500',
    countdown: '#FF4500',
    clockFace: '#3E3E58',
    clockHand: '#FFD700',
    activePrayer: '#D4AF37',
};

export const themes: Record<ThemeMode, ThemeColors> = {
    dark: darkTheme,
    light: lightTheme,
    mosque: mosqueTheme,
    ramadan: ramadanTheme,
};

export const getTheme = (mode: ThemeMode, customColors?: Partial<ThemeColors>): ThemeColors => {
    const baseTheme = themes[mode];
    return customColors ? { ...baseTheme, ...customColors } : baseTheme;
};

export const fontSizes = {
    small: {
        base: '0.85rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
    },
    medium: {
        base: '1rem',
        lg: '1.125rem',
        xl: '1.5rem',
        '2xl': '1.875rem',
        '3xl': '2.25rem',
        '4xl': '3rem',
        '5xl': '3.75rem',
    },
    large: {
        base: '1.125rem',
        lg: '1.25rem',
        xl: '1.75rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        '4xl': '3.5rem',
        '5xl': '4.5rem',
    },
};

export const fontFamilies = {
    modern: "'Tajawal', 'Arial', sans-serif",
    arabic: "'Amiri', 'Traditional Arabic', serif",
    naskh: "'Cairo', 'Times New Roman', sans-serif",
};
