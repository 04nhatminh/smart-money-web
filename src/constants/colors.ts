// Light Theme Colors
export const LIGHT_COLORS = {
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#EEEEEE',
  },
  
  // Text
  text: {
    primary: '#212121',
    secondary: '#616161',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  
  // Surfaces (elevated components)
  surface: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
  },
  
  // States
  states: {
    hover: 'rgba(0, 0, 0, 0.04)',
    active: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.12)',
  },
  
  // Interactive
  interactive: {
    primary: '#3629B7',
    primaryHover: '#1565C0',
    primaryActive: '#1565C0',
    secondary: '#5655B9',
    secondaryHover: '#5655B9',
    danger: '#D32F2F',
    dangerHover: '#C62828',
    success: '#388E3C',
    successHover: '#2E7D32',
    warning: '#F57F17',
    warningHover: '#E65100',
    info: '#0288D1',
    infoHover: '#01579B',
  },
  
  // Borders
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#9E9E9E',
  },
  
  // Shadows (light theme uses subtle shadows)
  shadow: {
    sm: 'rgba(0, 0, 0, 0.1)',
    md: 'rgba(0, 0, 0, 0.12)',
    lg: 'rgba(0, 0, 0, 0.14)',
  }
} as const;

// Dark Theme Colors
export const DARK_COLORS = {
  // Backgrounds
  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2C2C2C',
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#BDBDBD',
    tertiary: '#757575',
    inverse: '#FFFFFF',
  },
  
  // Surfaces (elevated components)
  surface: {
    primary: '#1E1E1E',
    secondary: '#2C2C2C',
  },
  
  // States
  states: {
    hover: 'rgba(255, 255, 255, 0.08)',
    active: 'rgba(255, 255, 255, 0.12)',
    disabled: 'rgba(255, 255, 255, 0.12)',
  },
  
  // Interactive
  interactive: {
    primary: '#3629B7',
    primaryHover: '#1565C0',
    primaryActive: '#1565C0',
    secondary: '#5655B9',
    secondaryHover: '#5655B9',
    danger: '#D32F2F',
    dangerHover: '#C62828',
    success: '#388E3C',
    successHover: '#2E7D32',
    warning: '#F57F17',
    warningHover: '#E65100',
    info: '#0288D1',
    infoHover: '#01579B',
  },
  
  // Borders
  border: {
    light: '#424242',
    medium: '#616161',
    dark: '#9E9E9E',
  },
  
  // Shadows (dark theme uses lighter shadows)
  shadow: {
    sm: 'rgba(0, 0, 0, 0.3)',
    md: 'rgba(0, 0, 0, 0.4)',
    lg: 'rgba(0, 0, 0, 0.5)',
  }
} as const;

// Type definition for colors
export type ColorScheme = 'light' | 'dark';
export type Colors = typeof LIGHT_COLORS | typeof DARK_COLORS;
