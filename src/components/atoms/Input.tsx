'use client';

import React from 'react';
import { useTheme } from '@/context';
import { BORDER_RADIUS, SHADOWS, TRANSITIONS } from '@/constants';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  elevation?: 'sm' | 'md';
}

export const Input: React.FC<InputProps> = ({ label, error, elevation = 'sm', className = '', ...props }) => {
  const { colors } = useTheme();

  const shadowStyles = {
    sm: SHADOWS.sm,
    md: SHADOWS.md,
  };

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: colors.text.primary }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          backgroundColor: colors.surface.primary,
          borderColor: error ? colors.interactive.danger : colors.border.light,
          borderWidth: '1px',
          borderRadius: BORDER_RADIUS.lg,
          color: colors.text.primary,
          boxShadow: shadowStyles[elevation],
          transition: TRANSITIONS.base,
          padding: '0.75rem 1rem',
          fontSize: '1rem',
          caretColor: colors.interactive.primary,
        }}
        className={`w-full focus:outline-none focus:ring-2 ${className}`}
        {...props}
      />
      {error && (
        <span
          className="text-sm mt-1 block"
          style={{ color: colors.interactive.danger }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
