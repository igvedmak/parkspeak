import { useState, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TimerDisplay } from '../../../components/exercise/TimerDisplay';
import { TimedResultsCard } from '../../../components/exercise/TimedResultsCard';
import { Typography } from '../../../components/ui/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useCountdownTimer } from '../../../hooks/useCountdownTimer';
import { useStopwatch } from '../../../hooks/useStopwatch';
import {
  getShuffledTimedExercises,
  computeSZRatio,
  type TimedExerciseType,
  type TimedExercise,
} from '../../../lib/timedContent';
import { saveAttempt } from '../../../lib/database';
import { colors, spacing } from '../../../constants/theme';
import React from 'react';

type Phase = 'ready' | 'active' | 'results';

export default function TimedExerciseScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const exerciseType = (type as TimedExerciseType) || 'warmup';

  const [exercises] = useState<TimedExercise[]>(() =>
    getShuffledTimedExercises(i18n.language, exerciseType)
  );
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [resultDuration, setResultDuration] = useState(0);
  const szRef = useRef<{ s: number; z: number }>({ s: 0, z: 0 });

  const currentExercise = exercises[exerciseIndex];
  const isStopwatch = currentExercise?.durationSeconds === null;

  const handleCountdownComplete = useCallback(() => {
    if (!currentExercise) return;
    setResultDuration(currentExercise.durationSeconds ?? 0);
    setPhase('results');

    saveAttempt({
      exerciseId: currentExercise.id,
      exerciseType,
      durationSeconds: currentExercise.durationSeconds ?? 0,
      avgLoudness: null,
      intelligibility: null,
      recognizedText: '',
      targetText: currentExercise.prompt,
      language: i18n.language,
    }).catch((e) => console.error('[DB] Failed to save timed attempt:', e));
  }, [currentExercise, exerciseType, i18n.language]);

  const countdown = useCountdownTimer({
    durationSeconds: currentExercise?.durationSeconds ?? 10,
    onComplete: handleCountdownComplete,
  });

  const stopwatch = useStopwatch();

  const handleStart = () => {
    setPhase('active');
    if (isStopwatch) {
      stopwatch.reset();
      stopwatch.start();
    } else {
      countdown.reset();
      countdown.start();
    }
  };

  const handleStopwatchStop = () => {
    const elapsed = stopwatch.elapsedSeconds;
    stopwatch.stop();
    setResultDuration(elapsed);
    setPhase('results');

    if (!currentExercise) return;

    // Track S/Z ratio durations
    if (currentExercise.category === 'sz-s') {
      szRef.current.s = elapsed;
    } else if (currentExercise.category === 'sz-z') {
      szRef.current.z = elapsed;
    }

    saveAttempt({
      exerciseId: currentExercise.id,
      exerciseType,
      durationSeconds: elapsed,
      avgLoudness: null,
      intelligibility: null,
      recognizedText: '',
      targetText: currentExercise.prompt,
      language: i18n.language,
      measuredValue: elapsed,
    }).catch((e) => console.error('[DB] Failed to save timed attempt:', e));
  };

  const handleRetry = () => {
    setPhase('ready');
    setResultDuration(0);
    countdown.reset();
    stopwatch.reset();
  };

  const handleNext = () => {
    setPhase('ready');
    setResultDuration(0);
    countdown.reset();
    stopwatch.reset();
    setExerciseIndex((prev) => prev + 1);
  };

  const handleDone = () => {
    router.back();
  };

  if (!currentExercise) {
    return (
      <View style={[styles.container, styles.content]}>
        <Typography variant="body">{t('common.loading')}</Typography>
      </View>
    );
  }

  const TITLE_KEYS: Record<TimedExerciseType, string> = {
    breath: 'exercises.breath',
    facial: 'exercises.facial',
    warmup: 'exercises.warmup',
  };

  // Compute S/Z ratio metric if both S and Z are completed
  const szRatio = szRef.current.s > 0 && szRef.current.z > 0
    ? computeSZRatio(szRef.current.s, szRef.current.z)
    : null;

  const metricLabel = currentExercise.metric === 'count'
    ? t('timedExercise.count')
    : currentExercise.metric === 'duration'
    ? t('timedExercise.duration')
    : undefined;

  const metricValue = currentExercise.metric === 'duration'
    ? `${resultDuration}s`
    : currentExercise.metric === 'count'
    ? `${resultDuration}`
    : undefined;

  const hasNext = exerciseIndex < exercises.length - 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t(TITLE_KEYS[exerciseType]),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {/* Exercise counter */}
        <Typography variant="caption" align="center">
          {exerciseIndex + 1} / {exercises.length}
        </Typography>

        {phase === 'results' ? (
          <>
            <TimedResultsCard
              durationSeconds={resultDuration}
              metricLabel={metricLabel}
              metricValue={metricValue}
              onRetry={handleRetry}
              onNext={hasNext ? handleNext : undefined}
              onDone={handleDone}
            />

            {/* Show S/Z ratio after both are done */}
            {szRatio !== null && currentExercise.category === 'sz-z' && (
              <Card style={styles.szCard}>
                <Typography variant="title" align="center" color={colors.accent}>
                  {t('timedExercise.szRatio')}: {szRatio.toFixed(2)}
                </Typography>
                <Typography variant="caption" align="center" color={colors.textSecondary}>
                  {t('timedExercise.szNormal')}
                </Typography>
              </Card>
            )}

            {/* Warmup complete message on last exercise */}
            {exerciseType === 'warmup' && !hasNext && (
              <Card style={styles.warmupDoneCard}>
                <Typography variant="body" align="center" color={colors.success}>
                  {t('timedExercise.warmupComplete')}
                </Typography>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Prompt card */}
            <Card style={styles.promptCard}>
              <Typography variant="title" align="center">
                {currentExercise.prompt}
              </Typography>
              <Typography variant="body" align="center" color={colors.textSecondary} style={styles.instruction}>
                {currentExercise.instruction}
              </Typography>
            </Card>

            {/* Timer / Stopwatch display */}
            {phase === 'active' && (
              <TimerDisplay
                seconds={isStopwatch ? stopwatch.elapsedSeconds : countdown.secondsRemaining}
                isRunning={isStopwatch ? stopwatch.isRunning : countdown.isRunning}
                label={isStopwatch ? t('timedExercise.stopwatch') : t('timedExercise.timeRemaining')}
              />
            )}

            {/* Action button */}
            <View style={styles.buttonArea}>
              {phase === 'ready' && (
                <Button
                  title={t('timedExercise.go')}
                  onPress={handleStart}
                  variant="primary"
                  style={styles.goButton}
                />
              )}
              {phase === 'active' && isStopwatch && (
                <Button
                  title={t('common.stop')}
                  onPress={handleStopwatchStop}
                  variant="primary"
                  style={styles.stopButton}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  promptCard: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  instruction: {
    marginTop: spacing.sm,
  },
  buttonArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  goButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  stopButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.error,
  },
  szCard: {
    gap: spacing.sm,
  },
  warmupDoneCard: {
    paddingVertical: spacing.lg,
  },
});
