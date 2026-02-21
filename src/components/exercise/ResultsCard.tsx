import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { thresholds } from '../../constants/thresholds';
import { formatDuration } from '../../lib/audio';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface ResultsCardProps {
  loudnessRatio: number | null;
  intelligibility: number | null;
  durationSeconds: number;
  onRetry: () => void;
  onNext?: () => void;
  onDone: () => void;
  requirePerfectScore?: boolean;
}

export function ResultsCard({
  loudnessRatio,
  intelligibility,
  durationSeconds,
  onRetry,
  onNext,
  onDone,
  requirePerfectScore = false,
}: ResultsCardProps) {
  const { t } = useTranslation();
  const loudnessOk = loudnessRatio === null || loudnessRatio >= thresholds.loudnessGood;
  const intelligibilityOk = intelligibility === null || intelligibility >= thresholds.intelligibilityGood;
  const isGood = loudnessOk && intelligibilityOk;

  return (
    <Card style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: isGood ? colors.successLight : colors.warningLight }]}>
        <Ionicons
          name={isGood ? 'checkmark-circle' : 'arrow-up-circle'}
          size={40}
          color={isGood ? colors.success : colors.warning}
        />
      </View>

      <Typography variant="title" align="center">
        {isGood ? t('exercise.greatJob') : t('exercise.keepPracticing')}
      </Typography>

      <View style={styles.metrics}>
        {loudnessRatio !== null && (
          <MetricRow
            label={t('exercise.volume')}
            value={`${loudnessRatio.toFixed(1)}x`}
            good={loudnessRatio >= thresholds.loudnessGood}
          />
        )}
        {intelligibility !== null && (
          <MetricRow
            label={t('exercise.accuracy')}
            value={`${intelligibility}%`}
            good={intelligibility >= thresholds.intelligibilityGood}
          />
        )}
        <MetricRow
          label={t('exercise.duration')}
          value={formatDuration(durationSeconds)}
          good={true}
        />
      </View>

      <View style={styles.actions}>
        <Button title={t('common.retry')} onPress={onRetry} variant="outline" icon="refresh" />
        {onNext && (() => {
          const blocked = requirePerfectScore && intelligibility !== null && intelligibility < 100;
          return (
            <Button
              title={t('common.next')}
              onPress={onNext}
              variant={blocked ? 'secondary' : 'primary'}
              disabled={blocked}
              icon="arrow-forward"
            />
          );
        })()}
        <Button title={t('common.done')} onPress={onDone} icon="checkmark" />
      </View>
      {onNext && requirePerfectScore && intelligibility !== null && intelligibility < 100 && (
        <Typography variant="caption" align="center" color={colors.warning}>
          {t('exercise.perfectScoreRequired')}
        </Typography>
      )}
    </Card>
  );
}

function MetricRow({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <View style={styles.metricRow}>
      <Typography variant="body">{label}</Typography>
      <View style={[styles.metricBadge, { backgroundColor: good ? colors.successLight : colors.warningLight }]}>
        <Typography
          variant="body"
          color={good ? colors.success : colors.warning}
          style={{ fontWeight: '600' }}
        >
          {value}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metrics: {
    gap: spacing.sm,
    width: '100%',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  metricBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
});
