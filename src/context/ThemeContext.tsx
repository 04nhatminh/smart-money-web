'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorScheme, LIGHT_COLORS, DARK_COLORS, Colors } from '@/constants';

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: Colors;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setIsMounted(true);
    
    // Check localStorage first
    const savedTheme = localStorage.getItem('colorScheme') as ColorScheme | null;
    if (savedTheme) {
      setColorSchemeState(savedTheme);
      applyTheme(savedTheme);
      return;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setColorSchemeState('dark');
      applyTheme('dark');
    } else {
      setColorSchemeState('light');
      applyTheme('light');
    }
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

  const colors = colorScheme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  const value: ThemeContextType = {
    colorScheme,
    colors,
    toggleColorScheme,
    setColorScheme,
  };

  // Always provide context to avoid errors, even if not mounted
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
