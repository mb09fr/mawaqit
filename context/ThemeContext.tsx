import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ThemeColors, ThemeSettings } from '../types';
import { getTheme, fontSizes, fontFamilies } from '../themes';

interface ThemeContextType {
    theme: ThemeColors;
    settings: ThemeSettings;
    updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
    fontSize: typeof fontSizes.medium;
    fontFamily: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
    themeSettings: ThemeSettings;
    onThemeChange: (settings: ThemeSettings) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    themeSettings,
    onThemeChange
}) => {
    const theme = useMemo(
        () => getTheme(themeSettings.mode, themeSettings.customColors),
        [themeSettings.mode, themeSettings.customColors]
    );

    const fontSize = useMemo(
        () => fontSizes[themeSettings.fontSize],
        [themeSettings.fontSize]
    );

    const fontFamily = useMemo(
        () => {
            if (themeSettings.fontFamily === 'arabic') return fontFamilies.arabic;
            if (themeSettings.fontFamily === 'naskh') return fontFamilies.naskh;
            return fontFamilies.modern;
        },
        [themeSettings.fontFamily]
    );

    const updateThemeSettings = (newSettings: Partial<ThemeSettings>) => {
        onThemeChange({ ...themeSettings, ...newSettings });
    };

    // Apply CSS variables for theme colors
    useEffect(() => {
        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });

        // Apply font size and family
        root.style.setProperty('--font-family', fontFamily);
        Object.entries(fontSize).forEach(([key, value]) => {
            root.style.setProperty(`--font-size-${key}`, value);
        });

        // Always enable animations with 0.3s duration
        root.style.setProperty('--animation-duration', '0.3s');

        // Apply background image if set
        if (themeSettings.backgroundImage) {
            root.style.setProperty('--background-image', `url(${themeSettings.backgroundImage})`);
        } else {
            root.style.removeProperty('--background-image');
        }
    }, [theme, fontSize, fontFamily, themeSettings.backgroundImage]);

    const value = {
        theme,
        settings: themeSettings,
        updateThemeSettings,
        fontSize,
        fontFamily,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
