import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface TimedResultsCardProps {
  durationSeconds: number;
  metricLabel?: string;
  metricValue?: string;
  onNext?: () => void;
  onRetry: () => void;
  onDone: () => void;
}

export function TimedResultsCard({
  durationSeconds,
  metricLabel,
  metricValue,
  onNext,
  onRetry,
  onDone,
}: TimedResultsCardProps) {
  const { t } = useTranslation();
  const minutes = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;

  return (
    <Card style={styles.container}>
      <Typography variant="title" align="center" color={colors.success}>
        {t('exercise.greatJob')}
      </Typography>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Typography variant="title" color={colors.accent}>
            {minutes}:{secs.toString().padStart(2, '0')}
          </Typography>
          <Typography variant="caption">{t('timedExercise.duration')}</Typography>
        </View>
        {metricLabel && metricValue && (
          <View style={styles.metric}>
            <Typography variant="title" color={colors.accent}>
              {metricValue}
            </Typography>
            <Typography variant="caption">{metricLabel}</Typography>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        <Button title={t('common.retry')} onPress={onRetry} variant="outline" />
        {onNext && <Button title={t('common.next')} onPress={onNext} variant="primary" />}
        <Button title={t('common.done')} onPress={onDone} variant="secondary" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  buttons: {
    gap: spacing.sm,
  },
});
