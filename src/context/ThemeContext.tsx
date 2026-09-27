import React, { createContext, useContext, useEffect } from 'react';

/**
 * THEME: DAYLIGHT EXECUTIVE
 * High-contrast light slate greys, crisp structural borders, and deep slate ink
 * engineered for maximum legibility under bright daylight conditions.
 */

export interface ThemeColors {
  bgMain: string;
  bgCard: string;
  borderCard: string;
  textColor: string;
  textMuted: string;
  primary: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
}

export const themeColors: ThemeColors = {
  bgMain: '#F1F5F9',      // High-contrast light slate grey canvas (Slate 100)
  bgCard: '#FFFFFF',      // Crisp pure white executive card surface
  borderCard: '#CBD5E1',  // High-contrast structural slate border (Slate 300)
  textColor: '#0F172A',   // Deep Slate 900 ink for daylight legibility
  textMuted: '#334155',   // Slate 700 secondary text
  primary: '#059669',     // Executive Emerald 600
  accent: '#059669',
  accentLight: 'rgba(5, 150, 105, 0.10)',
  accentBorder: 'rgba(5, 150, 105, 0.30)',
};

interface ThemeContextType {
  theme: string;
  colors: ThemeColors;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'daylight-executive',
  colors: themeColors,
  isLight: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;

    // Set global theme classes for Daylight Executive
    root.className = 'light';
    document.body.className = 'light antialiased selection:bg-emerald-600/20';

    // Propagate CSS variables for Tailwind and components
    const vars = {
      '--theme-bg-page': themeColors.bgMain,
      '--theme-bg-header': 'rgba(255, 255, 255, 0.95)',
      '--theme-bg-card': themeColors.bgCard,
      '--theme-bg-card-subtle': '#F8FAFC',
      '--theme-bg-elevated': '#E2E8F0',
      '--theme-border': themeColors.borderCard,
      '--theme-border-strong': '#94A3B8',
      '--theme-border-subtle': '#E2E8F0',
      '--theme-text-primary': themeColors.textColor,
      '--theme-text-secondary': themeColors.textMuted,
      '--theme-text-muted': '#475569',
      '--theme-accent': themeColors.accent,
      '--theme-accent-hover': '#047857',
      '--theme-accent-light': themeColors.accentLight,
      '--theme-accent-border': themeColors.accentBorder,
    };

    Object.entries(vars).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });

    document.body.style.backgroundColor = themeColors.bgMain;
    document.body.style.color = themeColors.textColor;
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'daylight-executive', colors: themeColors, isLight: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
