import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { generateReport, formatReportAsText, shareReport } from '../../lib/report';
import {
  getWeeklyStats,
  getMonthlyStats,
  getCurrentStreak,
  getRecentAttempts,
  getPerceptionStats,
  type DailyStat,
} from '../../lib/database';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, exerciseColors } from '../../constants/theme';
import { thresholds } from '../../constants/thresholds';
import React from 'react';

const EXERCISE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  phonation: 'volume-high',
  reading: 'book',
  articulation: 'chatbubble-ellipses',
  pitch: 'musical-notes',
  functional: 'chatbubbles',
  warmup: 'mic',
  breath: 'fitness',
  facial: 'happy',
};

const EXERCISE_COLOR_KEYS: Record<string, keyof typeof exerciseColors> = {
  phonation: 'phonation',
  reading: 'reading',
  articulation: 'articulation',
  pitch: 'pitch',
  functional: 'functional',
  warmup: 'warmup',
  breath: 'breath',
  facial: 'facial',
};

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
  const [perceptionStats, setPerceptionStats] = useState<{ total: number; correct: number }>({ total: 0, correct: 0 });

  const loadData = useCallback(async () => {
    const [weeklyOrMonthly, currentStreak, recent, perception] = await Promise.all([
      period === 'week' ? getWeeklyStats() : getMonthlyStats(),
      getCurrentStreak(),
      getRecentAttempts(10),
      getPerceptionStats(period === 'week' ? 7 : 30),
    ]);
    setStats(weeklyOrMonthly);
    setStreak(currentStreak);
    setRecentAttempts(recent);
    setPerceptionStats(perception);
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
  const maxExercises = Math.max(...stats.map((s) => s.exercises_completed), 1);

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
                  <Typography variant="title" color={avgLoudness >= thresholds.loudnessGood ? colors.success : colors.warning}>
                    {avgLoudness.toFixed(1)}x
                  </Typography>
                  <Typography variant="caption">{t('progress.loudness')}</Typography>
                </View>
              )}
              {avgIntelligibility != null && (
                <View style={styles.avgItem}>
                  <Typography variant="title" color={avgIntelligibility >= thresholds.intelligibilityGood ? colors.success : colors.warning}>
                    {avgIntelligibility}%
                  </Typography>
                  <Typography variant="caption">{t('progress.clarity')}</Typography>
                </View>
              )}
            </View>
          </Card>

          {/* Self-awareness / perception accuracy */}
          {perceptionStats.total > 0 && (
            <Card style={styles.averagesCard}>
              <Typography variant="body" style={styles.sectionLabel}>
                {t('progress.perceptionAccuracy')}
              </Typography>
              <View style={styles.avgItem}>
                <Typography
                  variant="title"
                  color={
                    perceptionStats.correct / perceptionStats.total >= 0.6
                      ? colors.success
                      : colors.warning
                  }
                >
                  {Math.round((perceptionStats.correct / perceptionStats.total) * 100)}%
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  {t('progress.perceptionDesc')}
                </Typography>
              </View>
            </Card>
          )}

          {/* Bar chart of daily activity */}
          <Card>
            <Typography variant="body" style={styles.sectionLabel}>
              {t('progress.dailyActivity')}
            </Typography>
            <View style={styles.chartContainer}>
              {stats.map((day) => {
                const height = Math.max((day.exercises_completed / maxExercises) * 100, 4);
                const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                });
                const hasExercises = day.exercises_completed > 0;
                return (
                  <View key={day.date} style={styles.barColumn}>
                    {hasExercises && (
                      <Typography variant="caption" align="center" style={styles.barCount}>
                        {day.exercises_completed}
                      </Typography>
                    )}
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${height}%`,
                            backgroundColor: hasExercises ? colors.accent : colors.border,
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
              {recentAttempts.map((attempt) => {
                const iconName = EXERCISE_ICONS[attempt.exercise_type] || 'ellipse';
                const colorKey = EXERCISE_COLOR_KEYS[attempt.exercise_type];
                const iconColor = colorKey ? exerciseColors[colorKey] : colors.accent;
                return (
                  <View key={attempt.id} style={styles.attemptRow}>
                    <Ionicons name={iconName} size={20} color={iconColor} style={styles.attemptIcon} />
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
                          color={attempt.avg_loudness >= thresholds.loudnessGood ? colors.success : colors.warning}
                        >
                          {attempt.avg_loudness.toFixed(1)}x
                        </Typography>
                      )}
                      {attempt.intelligibility != null && (
                        <Typography
                          variant="caption"
                          color={attempt.intelligibility >= thresholds.intelligibilityGood ? colors.success : colors.warning}
                        >
                          {attempt.intelligibility}%
                        </Typography>
                      )}
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {/* Share report with SLP */}
          <Button
            title={t('progress.exportReport')}
            onPress={async () => {
              const days = period === 'week' ? 7 : 30;
              const data = await generateReport(days);
              const text = formatReportAsText(data, t);
              await shareReport(text);
            }}
            variant="secondary"
            icon="share-outline"
          />
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
    <Pressable
      onPress={onPress}
      style={[styles.periodButton, active && styles.periodButtonActive]}
      accessibilityRole="button"
    >
      <Typography
        variant="body"
        align="center"
        color={active ? colors.surface : colors.textSecondary}
        style={{ fontWeight: active ? '600' : '400' }}
      >
        {label}
      </Typography>
    </Pressable>
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
      <View style={[styles.summaryAccent, { backgroundColor: color }]} />
      <Typography variant="heading" align="center" color={color}>
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
    overflow: 'hidden',
  },
  summaryAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
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
    borderTopLeftRadius: borderRadius.sm,
    borderTopRightRadius: borderRadius.sm,
    minHeight: 4,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    marginTop: spacing.xs,
  },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  attemptIcon: {
    width: 24,
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
