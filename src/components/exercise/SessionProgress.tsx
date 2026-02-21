import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progress, { duration: 400 });
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(animatedWidth.value * 100)}%`,
  }));

  return (
    <View style={styles.container}>
      <Typography variant="caption" align="center" color={colors.textSecondary}>
        {t('session.step', { current: currentStep, total: totalSteps })}
      </Typography>
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  barBackground: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
  },
});
