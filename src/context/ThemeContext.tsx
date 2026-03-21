'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorScheme, PRIMARY_COLORS, DARK_COLORS } from '@/constants';

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: typeof PRIMARY_COLORS | typeof DARK_COLORS;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to get initial theme synchronously
const getInitialTheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'light';
  
  try {
    const saved = localStorage.getItem('colorScheme') as ColorScheme | null;
    if (saved) return saved;
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {}
  
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with actual value, not just 'light'
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => getInitialTheme());
  const [isMounted, setIsMounted] = useState(false);

  // Apply theme on mount to ensure consistency
  useEffect(() => {
    const current = getInitialTheme();
    setColorSchemeState(current);
    applyTheme(current);
    setIsMounted(true);
  }, []);

  const applyTheme = (scheme: ColorScheme) => {
    const html = document.documentElement;
    if (scheme === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem('colorScheme', scheme);
    applyTheme(scheme);
  };

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  const colors = colorScheme === 'dark' ? DARK_COLORS : PRIMARY_COLORS;

  const value: ThemeContextType = {
    colorScheme,
    colors,
    toggleColorScheme,
    setColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
