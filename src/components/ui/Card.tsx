import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'highlighted' | 'accent';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  return <View style={[styles.base, variantStyles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  } as ViewStyle,
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.surface,
    ...shadows.card,
  } as ViewStyle,
  flat: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  } as ViewStyle,
  highlighted: {
    backgroundColor: colors.accentLight,
  } as ViewStyle,
  accent: {
    backgroundColor: colors.accent,
    ...shadows.lg,
  } as ViewStyle,
});
