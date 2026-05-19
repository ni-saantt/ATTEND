import { darkColors, lightColors } from '../theme';

const tintColorLight = lightColors.primary;
const tintColorDark = darkColors.primary;

export default {
  light: {
    text: lightColors.textPrimary,
    background: lightColors.background,
    tint: tintColorLight,
    tabIconDefault: lightColors.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: darkColors.textPrimary,
    background: darkColors.background,
    tint: tintColorDark,
    tabIconDefault: darkColors.textMuted,
    tabIconSelected: tintColorDark,
  },
};
