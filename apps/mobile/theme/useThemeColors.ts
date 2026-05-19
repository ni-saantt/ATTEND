import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';

export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === 'light' ? lightColors : darkColors;
}

export function useIsDarkMode(): boolean {
  const colorScheme = useColorScheme();
  return colorScheme !== 'light';
}
