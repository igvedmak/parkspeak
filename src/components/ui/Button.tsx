import { Pressable, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import React from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'default' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  icon,
  disabled = false,
  style,
}: ButtonProps) {
  const isLarge = size === 'large';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      unstable_pressDelay={accessibility.pressDelay}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isLarge && styles.large,
        variant === 'primary' && shadows.sm,
        pressed && (variant === 'primary' ? styles.pressedPrimary : styles.pressed),
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={isLarge ? 24 : 20}
            color={variant === 'outline' ? colors.accent : variant === 'secondary' ? colors.accent : colors.surface}
          />
        )}
        <Text
          style={[
            styles.text,
            isLarge && styles.textLarge,
            variant === 'outline' && styles.textOutline,
            variant === 'secondary' && styles.textSecondary,
            disabled && styles.textDisabled,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: accessibility.minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  large: {
    minHeight: 64,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  } as ViewStyle,
  pressedPrimary: {
    backgroundColor: colors.accentDark,
    transform: [{ scale: 0.98 }],
  } as ViewStyle,
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
  text: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.surface,
  } as TextStyle,
  textLarge: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  } as TextStyle,
  textOutline: {
    color: colors.accent,
  } as TextStyle,
  textSecondary: {
    color: colors.accent,
  } as TextStyle,
  textDisabled: {
    color: colors.textSecondary,
  } as TextStyle,
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
  } as ViewStyle,
  secondary: {
    backgroundColor: colors.accentLight,
  } as ViewStyle,
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent,
  } as ViewStyle,
});
