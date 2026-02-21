import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';
import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'heading' | 'title' | 'subtitle' | 'body' | 'bodyLarge' | 'caption' | 'overline';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}

export function Typography({
  children,
  variant = 'body',
  color,
  align,
  style,
}: TypographyProps) {
  return (
    <RNText
      style={[
        styles[variant],
        color ? { color } : undefined,
        align ? { textAlign: align } : undefined,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: typography.sizes.heading,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: typography.sizes.heading * typography.lineHeights.tight,
  } as TextStyle,
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
  } as TextStyle,
  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: typography.sizes.lg * typography.lineHeights.tight,
  } as TextStyle,
  body: {
    fontSize: typography.sizes.base,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  } as TextStyle,
  bodyLarge: {
    fontSize: typography.sizes.lg,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: typography.sizes.lg * typography.lineHeights.normal,
  } as TextStyle,
  caption: {
    fontSize: typography.sizes.small,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: typography.sizes.small * typography.lineHeights.normal,
  } as TextStyle,
  overline: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
});
