import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Typography } from '../ui/Typography';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';

interface DigitPadProps {
  digits: (number | null)[];
  onDigit: (d: number) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export function DigitPad({ digits, onDigit, onBackspace, disabled }: DigitPadProps) {
  return (
    <View style={styles.container}>
      <View style={styles.slotsRow}>
        {digits.map((d, i) => (
          <View key={i} style={[styles.slot, d !== null && styles.slotFilled]}>
            <Typography variant="title" color={d !== null ? colors.accent : colors.textSecondary}>
              {d !== null ? String(d) : '_'}
            </Typography>
          </View>
        ))}
      </View>

      <View style={styles.padGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Pressable
            key={n}
            onPress={() => onDigit(n)}
            disabled={disabled}
            unstable_pressDelay={accessibility.pressDelay}
            style={({ pressed }) => [
              styles.padButton,
              pressed && styles.padPressed,
              disabled && styles.padDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={String(n)}
          >
            <Typography variant="title">{String(n)}</Typography>
          </Pressable>
        ))}
        <Pressable
          onPress={() => onDigit(0)}
          disabled={disabled}
          unstable_pressDelay={accessibility.pressDelay}
          style={({ pressed }) => [
            styles.padButton,
            pressed && styles.padPressed,
            disabled && styles.padDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="0"
        >
          <Typography variant="title">0</Typography>
        </Pressable>
        <Pressable
          onPress={onBackspace}
          disabled={disabled}
          unstable_pressDelay={accessibility.pressDelay}
          style={({ pressed }) => [
            styles.padButton,
            styles.backspace,
            pressed && styles.padPressed,
            disabled && styles.padDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
        >
          <Typography variant="body" color={colors.error}>{'←'}</Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
  },
  slot: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  slotFilled: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  padGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: 280,
  },
  padButton: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  padPressed: {
    backgroundColor: colors.accentLight,
    transform: [{ scale: 0.95 }],
  },
  padDisabled: {
    opacity: 0.4,
  },
  backspace: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
});
