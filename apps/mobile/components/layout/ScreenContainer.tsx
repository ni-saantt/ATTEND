import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, ViewStyle, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, spacing } from '../../theme';

type ScreenContainerProps = {
  children: ReactNode;
  style?: ViewStyle;
  safeTop?: boolean;
  safeBottom?: boolean;
  gradient?: boolean;
  padded?: boolean;
};

export function ScreenContainer({
  children,
  style,
  safeTop = true,
  safeBottom = false,
  gradient = true,
  padded = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  const content = (
    <View
      style={[
        styles.container,
        safeTop && { paddingTop: insets.top },
        safeBottom && { paddingBottom: insets.bottom },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      {gradient ? (
        <LinearGradient
          colors={[colors.background, colors.surface, colors.background]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.gradient, { backgroundColor: colors.background }]}>{content}</View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
