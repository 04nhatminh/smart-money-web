import { useTheme } from '@/context';

/**
 * Custom hook to get theme colors and utilities
 * Provides easy access to color scheme and helper functions
 */
export const useThemeColors = () => {
  const { colors, colorScheme, toggleColorScheme, setColorScheme } = useTheme();

  return {
    colors,
    colorScheme,
    toggleColorScheme,
    setColorScheme,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
  };
};

/**
 * Get elevation shadow based on level
 * @param level - Shadow level (0-5)
 * @returns Box shadow CSS value
 */
export const getElevationShadow = (level: number = 1): string => {
  const shadows = [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ];
  return shadows[Math.min(level, shadows.length - 1)];
};

/**
 * Utility to combine color with opacity
 * @param color - Color value (hex, rgb, etc)
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
 */
export const withOpacity = (color: string, opacity: number): string => {
  if (!color.startsWith('#')) return color;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
