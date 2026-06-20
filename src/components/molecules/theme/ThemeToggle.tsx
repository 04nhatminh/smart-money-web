'use client';

import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '@/context';

export const ThemeToggle: React.FC = () => {
  const { colorScheme, toggleColorScheme, colors } = useTheme();

  return (
    <button
      onClick={toggleColorScheme}
      className="relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 hover:cursor-pointer shrink-0"
      style={{
        backgroundColor: colors.interactive.secondary,
        width: '56px',
        height: '30px',
      }}
      aria-label="Toggle theme"
    >
      {/* Toggle circle */}
      <div
        className="absolute w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
        style={{
          backgroundColor: colors.surface.primary,
          left: '3px',
          top: '3px',
          transform: colorScheme === 'light' ? 'translateX(0)' : 'translateX(26px)',
        }}
      >
        {colorScheme === 'light' ? (
          <FaSun className="w-3.5 h-3.5" style={{ color: colors.text.primary }} />
        ) : (
          <FaMoon className="w-3 h-3" style={{ color: colors.text.primary }} />
        )}
      </div>
    </button>
  );
};
