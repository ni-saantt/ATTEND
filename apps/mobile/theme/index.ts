export { colors, darkColors, lightColors, type ColorKey, type ThemeColors } from './colors';
export { useThemeColors, useIsDarkMode } from './useThemeColors';
export { spacing, borderRadius, type SpacingKey, type BorderRadiusKey } from './spacing';
export { typography, fontSizes, fontWeights, lineHeights, type TypographyKey } from './typography';
export { shadows, type ShadowKey } from './shadows';

export const glassStyles = {
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden' as const,
  },
  cardLight: {
    backgroundColor: 'rgba(40, 40, 40, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden' as const,
  },
  input: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputFocused: {
    borderColor: '#00C853',
    borderWidth: 1.5,
  },
  blur: {
    intensity: 40,
    tint: 'dark' as const,
  },
} as const;
