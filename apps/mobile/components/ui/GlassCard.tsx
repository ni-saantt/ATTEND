import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors, spacing, borderRadius, shadows } from '../../theme';

type GlassCardProps = {
  children: ReactNode;
  blur?: number;
  opacity?: number;
  borderGlow?: boolean;
  style?: ViewStyle;
  variant?: 'default' | 'light' | 'solid';
};

export function GlassCard({
  children,
  blur = 40,
  opacity = 0.7,
  borderGlow = false,
  style,
  variant = 'default',
}: GlassCardProps) {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  const cardStyle = [
    styles.card,
    { borderColor: colors.borderGlass },
    borderGlow && { borderColor: colors.glow, borderWidth: 1.5 },
    borderGlow && shadows.glow,
    style,
  ];

  if (variant === 'solid') {
    return (
      <View 
        style={[
          styles.solidCard, 
          { backgroundColor: colors.card, borderColor: colors.borderGlass },
          borderGlow && { borderColor: colors.glow },
          style
        ]}
      >
        {children}
      </View>
    );
  }

  const blurBgColor = isDark 
    ? `rgba(26, 26, 26, ${opacity})` 
    : `rgba(245, 245, 245, ${opacity})`;

  return (
    <View style={cardStyle}>
      <BlurView
        intensity={blur}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blurView,
          { backgroundColor: blurBgColor },
        ]}
      >
        <View style={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  solidCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  blurView: {
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
});
