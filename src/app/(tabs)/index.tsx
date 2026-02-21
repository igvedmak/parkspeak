import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CarryoverCard } from '../../components/home/CarryoverCard';
import { getTodayStats, getCurrentStreak, type DailyStat } from '../../lib/database';
import { colors, spacing, shadows } from '../../constants/theme';
import { thresholds } from '../../constants/thresholds';
import { accessibility } from '../../constants/accessibility';
import { useSettingsStore } from '../../store/useSettingsStore';
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

  const hearingTestedAt = useSettingsStore((s) => s.hearingTestedAt);

  const exercisesToday = todayStats?.exercises_completed ?? 0;
  const minutesToday = Math.round((todayStats?.total_duration_seconds ?? 0) / 60);

  // Show hearing prompt if never tested or tested > 90 days ago
  const showHearingPrompt = !hearingTestedAt ||
    (Date.now() - new Date(hearingTestedAt).getTime()) > 90 * 24 * 60 * 60 * 1000;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Typography variant="heading">{t('home.welcome')}</Typography>

      <Card style={styles.sessionCard}>
        <Typography variant="overline" color={colors.textSecondary}>
          {t('home.todayStats')}
        </Typography>
        {exercisesToday > 0 ? (
          <View style={styles.todayRow}>
            <View style={styles.todayItem}>
              <Typography variant="heading" color={colors.accent}>
                {exercisesToday}
              </Typography>
              <Typography variant="caption">{t('progress.exercises')}</Typography>
            </View>
            <View style={styles.todayItem}>
              <Typography variant="heading" color={colors.accent}>
                {minutesToday}
              </Typography>
              <Typography variant="caption">{t('home.minutesPracticed')}</Typography>
            </View>
            {todayStats?.avg_loudness != null && (
              <View style={styles.todayItem}>
                <Typography
                  variant="heading"
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
        size="large"
        icon="play-circle"
        style={styles.startButton}
      />

      <View style={styles.streakRow}>
        <Card style={styles.streakItem}>
          <Typography variant="heading" align="center" color={colors.accent}>
            {streak}
          </Typography>
          <Typography variant="caption" align="center">
            {t('home.streak')}
          </Typography>
        </Card>
        <Card style={styles.streakItem}>
          <Typography variant="heading" align="center" color={colors.accent}>
            {minutesToday}
          </Typography>
          <Typography variant="caption" align="center">
            {t('home.minutesPracticed')}
          </Typography>
        </Card>
      </View>

      {showHearingPrompt && (
        <Pressable
          onPress={() => router.push('/hearing-test' as any)}
          unstable_pressDelay={accessibility.pressDelay}
          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
          <Card variant="flat" style={styles.hearingPrompt}>
            <View style={styles.hearingAccent} />
            <Ionicons name="headset-outline" size={28} color={colors.accent} />
            <View style={styles.hearingPromptText}>
              <Typography variant="body" style={{ fontWeight: '600' }}>{t('hearing.title')}</Typography>
              <Typography variant="caption" color={colors.textSecondary}>
                {t('hearing.description')}
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </Card>
        </Pressable>
      )}

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
    ...shadows.lg,
  },
  streakRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  hearingPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  hearingAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  hearingPromptText: {
    flex: 1,
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
});
