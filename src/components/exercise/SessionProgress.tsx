import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface SessionProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function SessionProgress({ currentStep, totalSteps }: SessionProgressProps) {
  const { t } = useTranslation();
  const progress = totalSteps > 0 ? currentStep / totalSteps : 0;

  return (
    <View style={styles.container}>
      <Typography variant="caption" align="center" color={colors.textSecondary}>
        {t('session.step', { current: currentStep, total: totalSteps })}
      </Typography>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm / 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm / 2,
  },
});
