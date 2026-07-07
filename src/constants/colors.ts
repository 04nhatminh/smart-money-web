// Primary Color Palette
export const PRIMARY_PALETTE = {
  white: '#ffffff',
  100: '#eceafa',
  150: '#d8d5f6',
  200: '#c5c1f1',
  250: '#b1acec',
  300: '#9e97e7',
  350: '#8a82e3',
  400: '#776ede',
  450: '#6359d9',
  500: '#5044d5',
  550: '#3d2fd0',
  600: '#372abb',
  base: '#3629b7',
  700: '#3026a6',
  800: '#2a2191',
  850: '#241c7d',
  900: '#1e1868',
  925: '#181353',
  950: '#120e3e',
  975: '#0c092a',
  990: '#060515',
  black: '#000000',
} as const;

// Semantic Colors based on Primary Palette
export const PRIMARY_COLORS = {
  // Backgrounds
  background: {
    primary: PRIMARY_PALETTE.white,
    secondary: PRIMARY_PALETTE[100],
    tertiary: PRIMARY_PALETTE[150],
  },

  // Text
  text: {
    primary: PRIMARY_PALETTE[900],
    secondary: PRIMARY_PALETTE[600],
    tertiary: PRIMARY_PALETTE[400],
    inverse: PRIMARY_PALETTE.white,
  },

  // Surfaces (elevated components)
  surface: {
    primary: PRIMARY_PALETTE.white,
    secondary: PRIMARY_PALETTE[100],
  },

  // States
  states: {
    hover: 'rgba(54, 41, 183, 0.04)',
    active: 'rgba(54, 41, 183, 0.08)',
    disabled: 'rgba(54, 41, 183, 0.12)',
  },

  // Interactive
  interactive: {
    primary: PRIMARY_PALETTE.base,
    secondary: PRIMARY_PALETTE[150],
    tertiary: PRIMARY_PALETTE[350],
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
    light: PRIMARY_PALETTE[200],
    medium: PRIMARY_PALETTE[300],
    dark: PRIMARY_PALETTE[400],
  },

  // Shadows
  shadow: {
    sm: 'rgba(54, 41, 183, 0.1)',
    md: 'rgba(54, 41, 183, 0.12)',
    lg: 'rgba(54, 41, 183, 0.14)',
  },

  // Palette values (for gradient and direct access)
  palette: PRIMARY_PALETTE,
} as const;

// Dark Mode Color Palette
export const DARK_COLORS = {
  // Backgrounds
  background: {
    primary: PRIMARY_PALETTE[990],
    secondary: PRIMARY_PALETTE[900],
    tertiary: PRIMARY_PALETTE[850],
  },

  // Text
  text: {
    primary: PRIMARY_PALETTE.white,
    secondary: PRIMARY_PALETTE[150],
    tertiary: PRIMARY_PALETTE[200],
    inverse: PRIMARY_PALETTE[900],
  },

  // Surfaces (elevated components)
  surface: {
    primary: PRIMARY_PALETTE[900],
    secondary: PRIMARY_PALETTE[850],
  },

  // States
  states: {
    hover: 'rgba(200, 193, 241, 0.1)',
    active: 'rgba(200, 193, 241, 0.15)',
    disabled: 'rgba(200, 193, 241, 0.25)',
  },

  // Interactive
  interactive: {
    primary: PRIMARY_PALETTE[350],
    secondary: PRIMARY_PALETTE[550],
    tertiary: PRIMARY_PALETTE[700],
    danger: '#FF5252',
    dangerHover: '#FF1744',
    success: '#66BB6A',
    successHover: '#43A047',
    warning: '#FDD835',
    warningHover: '#F9A825',
    info: '#42A5F5',
    infoHover: '#1E88E5',
  },

  // Borders
  border: {
    light: PRIMARY_PALETTE[800],
    medium: PRIMARY_PALETTE[700],
    dark: PRIMARY_PALETTE[600],
  },

  // Shadows
  shadow: {
    sm: 'rgba(0, 0, 0, 0.5)',
    md: 'rgba(0, 0, 0, 0.6)',
    lg: 'rgba(0, 0, 0, 0.7)',
  },

  // Palette values (for gradient and direct access)
  palette: PRIMARY_PALETTE,
} as const;

export type ColorScheme = 'light' | 'dark';
