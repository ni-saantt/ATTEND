export const darkColors = {
  // Primary Accent (Bright Green - matches logo)
  primary: '#00C853',
  primaryDark: '#00A844',
  primaryLight: '#69F0AE',

  // Backgrounds (Dark Theme) - All unified to black
  background: '#000000',
  surface: '#000000',
  surfaceGlass: 'rgba(26, 26, 26, 0.95)',
  surfaceGlassLight: 'rgba(40, 40, 40, 0.9)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  header: '#000000',
  card: '#1A1A1A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textOnPrimary: '#000000',

  // Semantic Colors
  success: '#4ADE80',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',

  // Borders & Effects
  border: 'rgba(255, 255, 255, 0.1)',
  borderGlass: 'rgba(255, 255, 255, 0.15)',
  borderFocus: '#00C853',
  glow: 'rgba(0, 200, 83, 0.3)',
  glowStrong: 'rgba(0, 200, 83, 0.5)',

  // Gradient stops
  gradientStart: '#000000',
  gradientEnd: '#000000',

  // Transparent
  transparent: 'transparent',

  // Tab bar - matches background
  tabBar: '#000000',
  tabBarBorder: 'rgba(255, 255, 255, 0.05)',
} as const;

export const lightColors = {
  // Primary Accent (Bright Green - matches logo)
  primary: '#00C853',
  primaryDark: '#00A844',
  primaryLight: '#B9F6CA',

  // Backgrounds (Light Theme) - All unified to white
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(245, 245, 245, 0.95)',
  surfaceGlassLight: 'rgba(250, 250, 250, 0.9)',
  overlay: 'rgba(0, 0, 0, 0.3)',
  header: '#FFFFFF',
  card: '#F5F5F5',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: 'rgba(0, 0, 0, 0.7)',
  textMuted: 'rgba(0, 0, 0, 0.5)',
  textOnPrimary: '#FFFFFF',

  // Semantic Colors
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Borders & Effects
  border: 'rgba(0, 0, 0, 0.08)',
  borderGlass: 'rgba(0, 0, 0, 0.06)',
  borderFocus: '#00C853',
  glow: 'rgba(0, 200, 83, 0.4)',
  glowStrong: 'rgba(0, 200, 83, 0.6)',

  // Gradient stops
  gradientStart: '#FFFFFF',
  gradientEnd: '#FFFFFF',

  // Transparent
  transparent: 'transparent',

  // Tab bar - matches background
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(0, 0, 0, 0.05)',
} as const;

export const colors = darkColors;

export type ColorKey = keyof typeof darkColors;
export type ThemeColors = typeof darkColors;
