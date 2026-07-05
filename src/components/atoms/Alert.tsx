'use client';

import React from 'react';
import { useTheme } from '@/context';
import { MdClose, MdErrorOutline, MdCheckCircleOutline, MdInfoOutline, MdWarning } from 'react-icons/md';
import { Text } from './Text';

interface AlertProps {
  message: string | React.ReactNode;
  type?: 'error' | 'success' | 'warning' | 'info';
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  message,
  type = 'error',
  onClose,
  className = '',
}) => {
  const { colors } = useTheme();

  const getThemeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: `${colors.interactive.success}15`,
          text: colors.interactive.success,
          icon: <MdCheckCircleOutline className="w-5 h-5 flex-shrink-0" />,
        };
      case 'warning':
        return {
          bg: `${colors.interactive.warning || '#D97706'}15`,
          text: colors.interactive.warning || '#D97706',
          icon: <MdWarning className="w-5 h-5 flex-shrink-0" />,
        };
      case 'info':
        return {
          bg: `${colors.interactive.primary}15`,
          text: colors.interactive.primary,
          icon: <MdInfoOutline className="w-5 h-5 flex-shrink-0" />,
        };
      case 'error':
      default:
        return {
          bg: `${colors.interactive.danger}15`,
          text: colors.interactive.danger,
          icon: <MdErrorOutline className="w-5 h-5 flex-shrink-0" />,
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div
      className={`p-4 rounded-xl flex items-start justify-between gap-3 transition-all ${className}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
      }}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <span className="mt-0.5">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          {typeof message === 'string' ? (
            <Text className="font-semibold text-sm break-words leading-relaxed" style={{ color: styles.text }}>{message}</Text>
          ) : (
            message
          )}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg transition-colors hover:bg-black/5 active:bg-black/10 shrink-0 hover:cursor-pointer flex items-center justify-center"
          style={{ color: styles.text }}
          aria-label="Close alert"
        >
          <MdClose className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
