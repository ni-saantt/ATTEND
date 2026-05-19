import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors, spacing, borderRadius } from '../../theme';

type IconBadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
type IconBadgeSize = 'sm' | 'md' | 'lg';

type IconBadgeProps = {
  children: ReactNode;
  variant?: IconBadgeVariant;
  size?: IconBadgeSize;
  style?: ViewStyle;
};

const sizeValues: Record<IconBadgeSize, number> = {
  sm: 32,
  md: 44,
  lg: 56,
};

export function IconBadge({
  children,
  variant = 'secondary',
  size = 'md',
  style,
}: IconBadgeProps) {
  const colors = useThemeColors();
  
  const variantColors: Record<IconBadgeVariant, { bg: string; border: string }> = {
    primary: { bg: 'rgba(0, 200, 83, 0.2)', border: colors.primary },
    secondary: { bg: colors.surfaceGlass, border: colors.borderGlass },
    success: { bg: 'rgba(74, 222, 128, 0.2)', border: colors.success },
    error: { bg: 'rgba(248, 113, 113, 0.2)', border: colors.error },
    warning: { bg: 'rgba(251, 191, 36, 0.2)', border: colors.warning },
    info: { bg: 'rgba(96, 165, 250, 0.2)', border: colors.info },
  };

  const { bg, border } = variantColors[variant];
  const sizeValue = sizeValues[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
