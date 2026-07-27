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
  // Backgrounds - rich slate dark palette
  background: {
    primary: '#090A0F',
    secondary: '#131520',
    tertiary: '#1B1E2E',
  },

  // Text - high contrast & legibility
  text: {
    primary: '#FFFFFF',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Surfaces (elevated components, cards, sidebar, modals)
  surface: {
    primary: '#131520',
    secondary: '#1B1E2E',
  },

  // States
  states: {
    hover: 'rgba(255, 255, 255, 0.08)',
    active: 'rgba(255, 255, 255, 0.12)',
    disabled: 'rgba(255, 255, 255, 0.20)',
  },

  // Interactive
  interactive: {
    primary: '#6366F1',
    secondary: '#282B40',
    tertiary: '#373B56',
    danger: '#FF5252',
    dangerHover: '#FF1744',
    success: '#34D399',
    successHover: '#10B981',
    warning: '#FBBF24',
    warningHover: '#F59E0B',
    info: '#38BDF8',
    infoHover: '#0284C7',
  },

  // Borders
  border: {
    light: '#26293B',
    medium: '#353952',
    dark: '#474D6E',
  },

  // Shadows
  shadow: {
    sm: 'rgba(0, 0, 0, 0.5)',
    md: 'rgba(0, 0, 0, 0.65)',
    lg: 'rgba(0, 0, 0, 0.8)',
  },

  // Palette values (for gradient and direct access)
  palette: PRIMARY_PALETTE,
} as const;

export type ColorScheme = 'light' | 'dark';
