import React, { createContext, useContext, useEffect } from 'react';

/**
 * THEME: QUICKSTACK (Refined Institutional)
 * Inspired by 3DVC Quickstack template: clean grids, soft darks, high legibility.
 * This replaces the previous multi-theme architecture to reduce eye strain.
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
  bgMain: '#0B0E14',      // Soft deep charcoal (less strain than pure black)
  bgCard: '#12151C',      // Subtle elevation
  borderCard: '#1E232D',  // Clean grid borders
  textColor: '#F1F5F9',   // Off-white for readability
  textMuted: '#94A3B8',   // Muted slate
  primary: '#10B981',     // Institutional Emerald
  accent: '#10B981',
  accentLight: 'rgba(16, 185, 129, 0.08)',
  accentBorder: 'rgba(16, 185, 129, 0.15)',
};

interface ThemeContextType {
  theme: string;
  colors: ThemeColors;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'quickstack',
  colors: themeColors,
  isLight: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    
    // Set global theme classes
    root.className = 'dark';
    document.body.className = 'dark antialiased selection:bg-emerald-500/30';

    // Propagate CSS variables for Tailwind and components
    const vars = {
      '--theme-bg-page': themeColors.bgMain,
      '--theme-bg-header': 'rgba(11, 14, 20, 0.9)',
      '--theme-bg-card': themeColors.bgCard,
      '--theme-bg-card-subtle': '#161A23',
      '--theme-border': themeColors.borderCard,
      '--theme-border-subtle': '#181C25',
      '--theme-text-primary': themeColors.textColor,
      '--theme-text-secondary': themeColors.textMuted,
      '--theme-text-muted': '#475569',
      '--theme-accent': themeColors.accent,
      '--theme-accent-hover': '#059669',
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
    <ThemeContext.Provider value={{ theme: 'quickstack', colors: themeColors, isLight: false }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
