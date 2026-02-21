import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import {
  getWeeklyStats,
  getMonthlyStats,
  getCurrentStreak,
  getRecentAttempts,
  type DailyStat,
} from '../../lib/database';
import { colors, spacing, borderRadius } from '../../constants/theme';
import React from 'react';

type Period = 'week' | 'month';

export default function ProgressScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [streak, setStreak] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState<
    Array<{
      id: string;
      exercise_type: string;
      recorded_at: string;
      duration_seconds: number;
      avg_loudness: number | null;
      intelligibility: number | null;
    }>
  >([]);

  const loadData = useCallback(async () => {
    const [weeklyOrMonthly, currentStreak, recent] = await Promise.all([
      period === 'week' ? getWeeklyStats() : getMonthlyStats(),
      getCurrentStreak(),
      getRecentAttempts(10),
    ]);
    setStats(weeklyOrMonthly);
    setStreak(currentStreak);
    setRecentAttempts(recent);
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalExercises = stats.reduce((sum, s) => sum + s.exercises_completed, 0);
  const totalMinutes = Math.round(
    stats.reduce((sum, s) => sum + s.total_duration_seconds, 0) / 60
  );
  const avgLoudness = (() => {
    const withLoudness = stats.filter((s) => s.avg_loudness != null);
    if (withLoudness.length === 0) return null;
    return withLoudness.reduce((sum, s) => sum + (s.avg_loudness ?? 0), 0) / withLoudness.length;
  })();
  const avgIntelligibility = (() => {
    const withIntel = stats.filter((s) => s.avg_intelligibility != null);
    if (withIntel.length === 0) return null;
    return Math.round(
      withIntel.reduce((sum, s) => sum + (s.avg_intelligibility ?? 0), 0) / withIntel.length
    );
  })();

  const hasData = stats.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {/* Period toggle */}
      <View style={styles.periodToggle}>
        <PeriodButton
          label={t('progress.thisWeek')}
          active={period === 'week'}
          onPress={() => setPeriod('week')}
        />
        <PeriodButton
          label={t('progress.thisMonth')}
          active={period === 'month'}
          onPress={() => setPeriod('month')}
        />
      </View>

      {!hasData ? (
        <Card style={styles.emptyCard}>
          <Typography variant="body" align="center" color={colors.textSecondary}>
            {t('progress.noData')}
          </Typography>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <View style={styles.summaryRow}>
            <SummaryCard
              value={streak.toString()}
              label={t('home.streak')}
              color={colors.accent}
            />
            <SummaryCard
              value={totalExercises.toString()}
              label={t('progress.exercises')}
              color={colors.success}
            />
            <SummaryCard
              value={`${totalMinutes}`}
              label={t('progress.totalTime')}
              color={colors.accent}
            />
          </View>

          {/* Averages */}
          <Card style={styles.averagesCard}>
            <Typography variant="body" style={styles.sectionLabel}>
              {t('progress.averages')}
            </Typography>
            <View style={styles.averagesRow}>
              {avgLoudness != null && (
                <View style={styles.avgItem}>
                  <Typography variant="title" color={avgLoudness >= 1.5 ? colors.success : colors.warning}>
                    {avgLoudness.toFixed(1)}x
                  </Typography>
                  <Typography variant="caption">{t('progress.loudness')}</Typography>
                </View>
              )}
              {avgIntelligibility != null && (
                <View style={styles.avgItem}>
                  <Typography variant="title" color={avgIntelligibility >= 70 ? colors.success : colors.warning}>
                    {avgIntelligibility}%
                  </Typography>
                  <Typography variant="caption">{t('progress.clarity')}</Typography>
                </View>
              )}
            </View>
          </Card>

          {/* Bar chart of daily activity */}
          <Card>
            <Typography variant="body" style={styles.sectionLabel}>
              {t('progress.dailyActivity')}
            </Typography>
            <View style={styles.chartContainer}>
              {stats.map((day) => {
                const maxExercises = Math.max(...stats.map((s) => s.exercises_completed), 1);
                const height = Math.max((day.exercises_completed / maxExercises) * 100, 4);
                const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                });
                return (
                  <View key={day.date} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${height}%`,
                            backgroundColor:
                              day.exercises_completed > 0 ? colors.accent : colors.border,
                          },
                        ]}
                      />
                    </View>
                    <Typography variant="caption" align="center" style={styles.barLabel}>
                      {dayLabel}
                    </Typography>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Recent attempts */}
          {recentAttempts.length > 0 && (
            <Card>
              <Typography variant="body" style={styles.sectionLabel}>
                {t('progress.recentExercises')}
              </Typography>
              {recentAttempts.map((attempt) => (
                <View key={attempt.id} style={styles.attemptRow}>
                  <View style={styles.attemptInfo}>
                    <Typography variant="body">
                      {t(`exercises.${attempt.exercise_type}`)}
                    </Typography>
                    <Typography variant="caption">
                      {new Date(attempt.recorded_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </View>
                  <View style={styles.attemptMetrics}>
                    {attempt.avg_loudness != null && (
                      <Typography
                        variant="caption"
                        color={attempt.avg_loudness >= 1.5 ? colors.success : colors.warning}
                      >
                        {attempt.avg_loudness.toFixed(1)}x
                      </Typography>
                    )}
                    {attempt.intelligibility != null && (
                      <Typography
                        variant="caption"
                        color={attempt.intelligibility >= 70 ? colors.success : colors.warning}
                      >
                        {attempt.intelligibility}%
                      </Typography>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

function PeriodButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View
      style={[styles.periodButton, active && styles.periodButtonActive]}
      onTouchEnd={onPress}
    >
      <Typography
        variant="body"
        align="center"
        color={active ? colors.surface : colors.textSecondary}
        style={{ fontWeight: active ? '600' : '400' }}
      >
        {label}
      </Typography>
    </View>
  );
}

function SummaryCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Card style={styles.summaryCard}>
      <Typography variant="title" align="center" color={color}>
        {value}
      </Typography>
      <Typography variant="caption" align="center">
        {label}
      </Typography>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md - 2,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.accent,
  },
  emptyCard: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  averagesCard: {
    gap: spacing.md,
  },
  averagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  avgItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    gap: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: borderRadius.sm / 2,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: spacing.xs,
  },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attemptInfo: {
    flex: 1,
    gap: 2,
  },
  attemptMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
