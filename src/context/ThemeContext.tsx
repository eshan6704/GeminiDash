import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isLight: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('aurumx_theme_v1');
      if (saved === 'dark' || saved === 'light') return saved;
      // Default to dark mode to prevent eye strain
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const isLight = theme === 'light';

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('aurumx_theme_v1', t);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    setTheme(isLight ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.style.backgroundColor = '#0a0a0a';
      document.body.style.color = '#f5f5f5';
    }
  }, [isLight]);

  return (
    <ThemeContext.Provider value={{ theme, isLight, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
