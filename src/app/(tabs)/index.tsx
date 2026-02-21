import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CarryoverCard } from '../../components/home/CarryoverCard';
import { getTodayStats, getCurrentStreak, type DailyStat } from '../../lib/database';
import { colors, spacing } from '../../constants/theme';
import { thresholds } from '../../constants/thresholds';
import React from 'react';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [todayStats, setTodayStats] = useState<DailyStat | null>(null);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [stats, currentStreak] = await Promise.all([
          getTodayStats(),
          getCurrentStreak(),
        ]);
        setTodayStats(stats);
        setStreak(currentStreak);
      })();
    }, [])
  );

  const exercisesToday = todayStats?.exercises_completed ?? 0;
  const minutesToday = Math.round((todayStats?.total_duration_seconds ?? 0) / 60);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Typography variant="heading">{t('home.welcome')}</Typography>

      <Card style={styles.sessionCard}>
        <Typography variant="body" color={colors.textSecondary}>
          {t('home.todayStats')}
        </Typography>
        {exercisesToday > 0 ? (
          <View style={styles.todayRow}>
            <View style={styles.todayItem}>
              <Typography variant="title" color={colors.accent}>
                {exercisesToday}
              </Typography>
              <Typography variant="caption">{t('progress.exercises')}</Typography>
            </View>
            <View style={styles.todayItem}>
              <Typography variant="title" color={colors.accent}>
                {minutesToday}
              </Typography>
              <Typography variant="caption">{t('home.minutesPracticed')}</Typography>
            </View>
            {todayStats?.avg_loudness != null && (
              <View style={styles.todayItem}>
                <Typography
                  variant="title"
                  color={todayStats.avg_loudness >= thresholds.loudnessGood ? colors.success : colors.warning}
                >
                  {todayStats.avg_loudness.toFixed(1)}x
                </Typography>
                <Typography variant="caption">{t('progress.loudness')}</Typography>
              </View>
            )}
          </View>
        ) : (
          <Typography variant="caption" style={styles.noSession}>
            {t('home.noSessionYet')}
          </Typography>
        )}
      </Card>

      <Button
        title={t('home.dailySession')}
        onPress={() => router.push('/exercise/session')}
        style={styles.startButton}
      />

      <Card style={styles.streakCard}>
        <View style={styles.streakRow}>
          <View style={styles.streakItem}>
            <Typography variant="title" align="center" color={colors.accent}>
              {streak}
            </Typography>
            <Typography variant="caption" align="center">
              {t('home.streak')}
            </Typography>
          </View>
          <View style={styles.streakItem}>
            <Typography variant="title" align="center" color={colors.accent}>
              {minutesToday}
            </Typography>
            <Typography variant="caption" align="center">
              {t('home.minutesPracticed')}
            </Typography>
          </View>
        </View>
      </Card>

      <CarryoverCard />
    </ScrollView>
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
  sessionCard: {
    gap: spacing.sm,
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  todayItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  noSession: {
    fontStyle: 'italic',
  },
  startButton: {
    marginVertical: spacing.sm,
  },
  streakCard: {},
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
});
