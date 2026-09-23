import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'cyberpunk' | 'emerald' | 'ocean' | 'dracula';

export interface ThemeColors {
  name: string;
  isLight: boolean;
  bgMain: string;
  bgCard: string;
  borderCard: string;
  textColor: string;
  textMuted: string;
  primary: string;
  accent: string;
  buttonBg: string;
  buttonText: string;
  accentGlow: string;
  ringColor: string;
  tagline: string;
}

export const themes: Record<Theme, ThemeColors> = {
  dark: {
    name: 'Classic Dark',
    isLight: false,
    bgMain: 'bg-neutral-950',
    bgCard: 'bg-neutral-900',
    borderCard: 'border-neutral-800',
    textColor: 'text-neutral-100',
    textMuted: 'text-neutral-400',
    primary: 'amber-500',
    accent: 'orange-500',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',
    buttonText: 'text-neutral-950',
    accentGlow: 'shadow-amber-500/20',
    ringColor: 'ring-amber-400/50',
    tagline: 'Institutional Gold & Onyx style',
  },
  light: {
    name: 'Classic Light',
    isLight: true,
    bgMain: 'bg-slate-50',
    bgCard: 'bg-white',
    borderCard: 'border-slate-200',
    textColor: 'text-slate-900',
    textMuted: 'text-slate-500',
    primary: 'blue-600',
    accent: 'indigo-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    buttonText: 'text-white',
    accentGlow: 'shadow-blue-500/10',
    ringColor: 'ring-blue-400/50',
    tagline: 'Clean slate and executive blue',
  },
  cyberpunk: {
    name: 'Cyberpunk Neon',
    isLight: false,
    bgMain: 'bg-[#0b0314]',
    bgCard: 'bg-[#150a24]',
    borderCard: 'border-[#ec4899]/30',
    textColor: 'text-white',
    textMuted: 'text-pink-200/60',
    primary: 'cyan-400',
    accent: 'fuchsia-500',
    buttonBg: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90',
    buttonText: 'text-white',
    accentGlow: 'shadow-fuchsia-500/30',
    ringColor: 'ring-cyan-400/50',
    tagline: 'Synthwave pink, cyan & purple grid',
  },
  emerald: {
    name: 'Emerald Forest',
    isLight: false,
    bgMain: 'bg-[#020d08]',
    bgCard: 'bg-[#061e13]',
    borderCard: 'border-[#064e3b]/40',
    textColor: 'text-emerald-50',
    textMuted: 'text-emerald-400/60',
    primary: 'emerald-400',
    accent: 'teal-400',
    buttonBg: 'bg-emerald-500 hover:bg-emerald-600',
    buttonText: 'text-emerald-950',
    accentGlow: 'shadow-emerald-500/20',
    ringColor: 'ring-emerald-400/50',
    tagline: 'Deep forest green and fresh mint',
  },
  ocean: {
    name: 'Ocean Deep',
    isLight: false,
    bgMain: 'bg-[#010915]',
    bgCard: 'bg-[#051528]',
    borderCard: 'border-[#1e3a8a]/30',
    textColor: 'text-sky-50',
    textMuted: 'text-sky-400/60',
    primary: 'sky-400',
    accent: 'cyan-400',
    buttonBg: 'bg-sky-500 hover:bg-sky-600',
    buttonText: 'text-neutral-950',
    accentGlow: 'shadow-sky-500/20',
    ringColor: 'ring-sky-400/50',
    tagline: 'Subaquatic blue & bright cyan',
  },
  dracula: {
    name: 'Dracula Gothic',
    isLight: false,
    bgMain: 'bg-[#1e1f29]',
    bgCard: 'bg-[#282a36]',
    borderCard: 'border-[#44475a]',
    textColor: 'text-[#f8f8f2]',
    textMuted: 'text-[#6272a4]',
    primary: 'purple-400',
    accent: 'pink-500',
    buttonBg: 'bg-[#bd93f9] hover:bg-[#bd93f9]/90',
    buttonText: 'text-slate-900',
    accentGlow: 'shadow-purple-500/20',
    ringColor: 'ring-purple-400/50',
    tagline: 'Standard geek-friendly vampire theme',
  },
};

interface ThemeContextType {
  theme: Theme;
  isLight: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isLight: false,
  colors: themes.dark,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('aurumx_theme_v2');
      if (saved && Object.keys(themes).includes(saved)) return saved as Theme;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const colors = themes[theme];
  const isLight = theme === 'light';

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('aurumx_theme_v2', t);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    setTheme(isLight ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all old classes
    Object.keys(themes).forEach((t) => {
      root.classList.remove(t);
      document.body.classList.remove(`theme-${t}`);
    });

    root.classList.add(theme);
    document.body.classList.add(`theme-${theme}`);

    if (isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      if (theme === 'cyberpunk') {
        document.body.style.backgroundColor = '#0b0314';
      } else if (theme === 'emerald') {
        document.body.style.backgroundColor = '#020d08';
      } else if (theme === 'ocean') {
        document.body.style.backgroundColor = '#010915';
      } else if (theme === 'dracula') {
        document.body.style.backgroundColor = '#1e1f29';
      } else {
        document.body.style.backgroundColor = '#0a0a0a';
      }
      document.body.style.color = '#f5f5f5';
    }
  }, [theme, isLight]);

  return (
    <ThemeContext.Provider value={{ theme, isLight, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
