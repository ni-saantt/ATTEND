import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors, spacing, borderRadius, typography } from '../../theme';

type StatusPillVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

type StatusPillProps = {
  label: string;
  variant?: StatusPillVariant;
  style?: ViewStyle;
};

export function StatusPill({ label, variant = 'neutral', style }: StatusPillProps) {
  const colors = useThemeColors();
  
  const variantStyles: Record<StatusPillVariant, { bg: string; text: string }> = {
    success: { bg: 'rgba(74, 222, 128, 0.2)', text: colors.success },
    error: { bg: 'rgba(248, 113, 113, 0.2)', text: colors.error },
    warning: { bg: 'rgba(251, 191, 36, 0.2)', text: colors.warning },
    info: { bg: 'rgba(96, 165, 250, 0.2)', text: colors.info },
    neutral: { bg: colors.surfaceGlass, text: colors.textSecondary },
  };

  const { bg, text } = variantStyles[variant];

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
