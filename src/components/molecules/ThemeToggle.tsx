'use client';

import React from 'react';
import { useTheme } from '@/context';

export const ThemeToggle: React.FC = () => {
  const { colorScheme, toggleColorScheme, colors } = useTheme();

  return (
    <button
      onClick={toggleColorScheme}
      className="relative inline-flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2"
      style={{
        backgroundColor: colors.interactive.secondary,
        width: '60px',
        height: '32px',
      }}
      aria-label="Toggle theme"
    >
      {/* Toggle circle */}
      <div
        className="absolute w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
        style={{
          backgroundColor: colors.surface.primary,
          transform: colorScheme === 'light' ? 'translateX(2px)' : 'translateX(28px)',
        }}
      >
        {colorScheme === 'light' ? '☀️' : '🌙'}
      </div>
    </button>
  );
};
