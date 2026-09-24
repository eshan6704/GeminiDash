import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'executive' | 'alpine' | 'ivory' | 'nordic' | 'azure' | 'sage';

export interface ThemeColors {
  id: Theme;
  name: string;
  isLight: true;
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
  executive: {
    id: 'executive',
    name: 'Executive Platinum Daylight',
    isLight: true,
    bgMain: 'bg-[#f8fafc]',
    bgCard: 'bg-white',
    borderCard: 'border-slate-200',
    textColor: 'text-slate-900',
    textMuted: 'text-slate-500',
    primary: 'blue-600',
    accent: 'amber-500',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    buttonText: 'text-white',
    accentGlow: 'shadow-blue-500/10',
    ringColor: 'ring-blue-400/50',
    tagline: 'Ultra-crisp executive platinum daylight trading workstation',
  },
  alpine: {
    id: 'alpine',
    name: 'Alpine Clean Daylight',
    isLight: true,
    bgMain: 'bg-[#ffffff]',
    bgCard: 'bg-slate-50/80',
    borderCard: 'border-slate-200',
    textColor: 'text-slate-900',
    textMuted: 'text-slate-500',
    primary: 'emerald-600',
    accent: 'teal-600',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    buttonText: 'text-white',
    accentGlow: 'shadow-emerald-500/10',
    ringColor: 'ring-emerald-400/50',
    tagline: 'Pure daylight alpine white with vivid emerald metrics',
  },
  ivory: {
    id: 'ivory',
    name: 'Bloomberg Ivory Terminal',
    isLight: true,
    bgMain: 'bg-[#faf8f5]',
    bgCard: 'bg-white',
    borderCard: 'border-[#e8e2d8]',
    textColor: 'text-[#1c1917]',
    textMuted: 'text-[#78716c]',
    primary: 'amber-600',
    accent: 'orange-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
    buttonText: 'text-white',
    accentGlow: 'shadow-amber-500/10',
    ringColor: 'ring-amber-400/50',
    tagline: 'Warm financial parchment & executive brass accents',
  },
  nordic: {
    id: 'nordic',
    name: 'Nordic Dawn & Linen',
    isLight: true,
    bgMain: 'bg-[#f4f4f7]',
    bgCard: 'bg-white',
    borderCard: 'border-neutral-200',
    textColor: 'text-neutral-900',
    textMuted: 'text-neutral-500',
    primary: 'indigo-600',
    accent: 'violet-600',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
    buttonText: 'text-white',
    accentGlow: 'shadow-indigo-500/10',
    ringColor: 'ring-indigo-400/50',
    tagline: 'Soft daylight linen with calm indigo accents',
  },
  azure: {
    id: 'azure',
    name: 'Royal Azure Daylight',
    isLight: true,
    bgMain: 'bg-[#f0f7ff]',
    bgCard: 'bg-white',
    borderCard: 'border-sky-200',
    textColor: 'text-slate-900',
    textMuted: 'text-sky-700/70',
    primary: 'sky-600',
    accent: 'blue-600',
    buttonBg: 'bg-sky-600 hover:bg-sky-700',
    buttonText: 'text-white',
    accentGlow: 'shadow-sky-500/10',
    ringColor: 'ring-sky-400/50',
    tagline: 'Fresh corporate maritime sky with cobalt accents',
  },
  sage: {
    id: 'sage',
    name: 'Executive Sage Daylight',
    isLight: true,
    bgMain: 'bg-[#f2f7f4]',
    bgCard: 'bg-white',
    borderCard: 'border-emerald-200',
    textColor: 'text-emerald-950',
    textMuted: 'text-emerald-700/70',
    primary: 'emerald-700',
    accent: 'teal-600',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    buttonText: 'text-white',
    accentGlow: 'shadow-emerald-600/10',
    ringColor: 'ring-emerald-400/50',
    tagline: 'Botanical daylight with forest emerald accents',
  },
};

interface ThemeContextType {
  theme: Theme;
  isLight: true;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'executive',
  isLight: true,
  colors: themes.executive,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('aurumx_daylight_theme_v4');
      if (saved && Object.keys(themes).includes(saved)) {
        return saved as Theme;
      }
      // Migrate legacy storage or default to executive daylight
      return 'executive';
    } catch {
      return 'executive';
    }
  });

  const colors = themes[theme] || themes.executive;
  const isLight: true = true; // Always true: exclusively executive daylight themes

  const setTheme = (t: Theme) => {
    const validTheme = themes[t] ? t : 'executive';
    setThemeState(validTheme);
    try {
      localStorage.setItem('aurumx_daylight_theme_v4', validTheme);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    // Cycle daylight themes
    const themeKeys = Object.keys(themes) as Theme[];
    const nextIndex = (themeKeys.indexOf(theme) + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Clean all classes
    Object.keys(themes).forEach((t) => {
      root.classList.remove(t);
      root.classList.remove(`theme-${t}`);
      document.body.classList.remove(t);
      document.body.classList.remove(`theme-${t}`);
    });
    
    // Clean legacy dark classes
    root.classList.remove('dark', 'theme-graphite', 'theme-navy', 'theme-slate', 'theme-dusk', 'theme-emerald', 'theme-ocean');
    document.body.classList.remove('dark', 'theme-graphite', 'theme-navy', 'theme-slate', 'theme-dusk', 'theme-emerald', 'theme-ocean');

    // Add active daylight classes
    root.classList.add('light', theme, `theme-${theme}`);
    document.body.classList.add('light', theme, `theme-${theme}`);

    // Map theme CSS variables to root
    const themeVariables: Record<Theme, Record<string, string>> = {
      executive: {
        '--theme-bg-page': '#f8fafc',
        '--theme-bg-header': 'rgba(255, 255, 255, 0.95)',
        '--theme-bg-card': '#ffffff',
        '--theme-bg-card-subtle': '#f1f5f9',
        '--theme-border': '#e2e8f0',
        '--theme-border-subtle': '#f1f5f9',
        '--theme-text-primary': '#0f172a',
        '--theme-text-secondary': '#475569',
        '--theme-text-muted': '#94a3b8',
        '--theme-accent': '#2563eb',
        '--theme-accent-hover': '#1d4ed8',
        '--theme-accent-light': '#eff6ff',
        '--theme-accent-border': '#bfdbfe',
      },
      alpine: {
        '--theme-bg-page': '#ffffff',
        '--theme-bg-header': 'rgba(248, 250, 252, 0.95)',
        '--theme-bg-card': '#f8fafc',
        '--theme-bg-card-subtle': '#f1f5f9',
        '--theme-border': '#e2e8f0',
        '--theme-border-subtle': '#f1f5f9',
        '--theme-text-primary': '#0f172a',
        '--theme-text-secondary': '#334155',
        '--theme-text-muted': '#64748b',
        '--theme-accent': '#059669',
        '--theme-accent-hover': '#047857',
        '--theme-accent-light': '#ecfdf5',
        '--theme-accent-border': '#a7f3d0',
      },
      ivory: {
        '--theme-bg-page': '#faf8f5',
        '--theme-bg-header': 'rgba(250, 248, 245, 0.95)',
        '--theme-bg-card': '#ffffff',
        '--theme-bg-card-subtle': '#f5efe6',
        '--theme-border': '#e8e0d5',
        '--theme-border-subtle': '#f2ede4',
        '--theme-text-primary': '#1c1917',
        '--theme-text-secondary': '#57534e',
        '--theme-text-muted': '#78716c',
        '--theme-accent': '#d97706',
        '--theme-accent-hover': '#b45309',
        '--theme-accent-light': '#fffbeb',
        '--theme-accent-border': '#fde68a',
      },
      nordic: {
        '--theme-bg-page': '#f4f4f7',
        '--theme-bg-header': 'rgba(244, 244, 247, 0.95)',
        '--theme-bg-card': '#ffffff',
        '--theme-bg-card-subtle': '#ebebf0',
        '--theme-border': '#e2e2e8',
        '--theme-border-subtle': '#ededf2',
        '--theme-text-primary': '#18181b',
        '--theme-text-secondary': '#52525b',
        '--theme-text-muted': '#71717a',
        '--theme-accent': '#4f46e5',
        '--theme-accent-hover': '#4338ca',
        '--theme-accent-light': '#eef2ff',
        '--theme-accent-border': '#c7d2fe',
      },
      azure: {
        '--theme-bg-page': '#f0f7ff',
        '--theme-bg-header': 'rgba(240, 247, 255, 0.95)',
        '--theme-bg-card': '#ffffff',
        '--theme-bg-card-subtle': '#e0f0fe',
        '--theme-border': '#bae6fd',
        '--theme-border-subtle': '#e0f2fe',
        '--theme-text-primary': '#0c4a6e',
        '--theme-text-secondary': '#0369a1',
        '--theme-text-muted': '#38bdf8',
        '--theme-accent': '#0284c7',
        '--theme-accent-hover': '#0369a1',
        '--theme-accent-light': '#f0f9ff',
        '--theme-accent-border': '#bae6fd',
      },
      sage: {
        '--theme-bg-page': '#f2f7f4',
        '--theme-bg-header': 'rgba(242, 247, 244, 0.95)',
        '--theme-bg-card': '#ffffff',
        '--theme-bg-card-subtle': '#e2f1e8',
        '--theme-border': '#a7f3d0',
        '--theme-border-subtle': '#d1fae5',
        '--theme-text-primary': '#064e3b',
        '--theme-text-secondary': '#047857',
        '--theme-text-muted': '#10b981',
        '--theme-accent': '#059669',
        '--theme-accent-hover': '#047857',
        '--theme-accent-light': '#f0fdf4',
        '--theme-accent-border': '#a7f3d0',
      },
    };

    const vars = themeVariables[theme] || themeVariables.executive;
    Object.entries(vars).forEach(([k, v]) => {
      root.style.setProperty(k, v);
      document.body.style.setProperty(k, v);
    });

    document.body.style.backgroundColor = vars['--theme-bg-page'];
    document.body.style.color = vars['--theme-text-primary'];
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isLight, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
