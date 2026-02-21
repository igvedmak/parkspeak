import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { colors, spacing } from '../../constants/theme';
import React from 'react';

interface TimerDisplayProps {
  seconds: number;
  label?: string;
  isRunning: boolean;
}

export function TimerDisplay({ seconds, label, isRunning }: TimerDisplayProps) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Typography
        variant="heading"
        align="center"
        color={isRunning ? colors.accent : colors.textPrimary}
        style={styles.time}
      >
        {display}
      </Typography>
      {label && (
        <Typography variant="caption" align="center" color={colors.textSecondary}>
          {label}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  time: {
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
});
