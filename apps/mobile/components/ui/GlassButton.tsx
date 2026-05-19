import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors, spacing, borderRadius, typography, shadows } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type GlassButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: GlassButtonProps) {
  const colors = useThemeColors();

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
    },
    secondary: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.borderGlass,
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
    },
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: colors.textOnPrimary,
    secondary: colors.textPrimary,
    outline: colors.primary,
    ghost: colors.textSecondary,
  };

  const buttonStyles: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    variant === 'primary' && shadows.glow,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${size}Text`],
    { color: textColors[variant] },
    disabled && styles.disabledText,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textOnPrimary : colors.textPrimary}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyles}>{children}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  smSize: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  mdSize: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  lgSize: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
  },
  smText: {
    ...typography.buttonSmall,
  },
  mdText: {
    ...typography.button,
  },
  lgText: {
    ...typography.button,
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.7,
  },
});
