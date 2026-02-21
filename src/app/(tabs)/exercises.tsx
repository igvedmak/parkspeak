import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ExerciseCard } from '../../components/exercise/ExerciseCard';
import { Typography } from '../../components/ui/Typography';
import { colors, spacing } from '../../constants/theme';
import React from 'react';

const EXERCISE_TYPES = [
  { type: 'phonation', icon: '🔊', titleKey: 'exercises.phonation', descKey: 'exercises.phonationDesc', color: 'phonation' as const },
  { type: 'reading', icon: '📖', titleKey: 'exercises.reading', descKey: 'exercises.readingDesc', color: 'reading' as const },
  { type: 'articulation', icon: '🗣', titleKey: 'exercises.articulation', descKey: 'exercises.articulationDesc', color: 'articulation' as const },
  { type: 'pitch', icon: '🎵', titleKey: 'exercises.pitch', descKey: 'exercises.pitchDesc', color: 'pitch' as const },
  { type: 'functional', icon: '💬', titleKey: 'exercises.functional', descKey: 'exercises.functionalDesc', color: 'functional' as const },
] as const;

const TIMED_EXERCISE_TYPES = [
  { type: 'warmup', icon: '🎤', titleKey: 'exercises.warmup', descKey: 'exercises.warmupDesc', color: 'warmup' as const },
  { type: 'breath', icon: '💨', titleKey: 'exercises.breath', descKey: 'exercises.breathDesc', color: 'breath' as const },
  { type: 'facial', icon: '😊', titleKey: 'exercises.facial', descKey: 'exercises.facialDesc', color: 'facial' as const },
] as const;

export default function ExercisesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {/* Guided session — hero card */}
      <ExerciseCard
        title={t('session.startGuided')}
        description={t('session.startGuidedDesc')}
        icon="🎯"
        onPress={() => router.push('/exercise/session')}
        accentColor="guided"
        variant="hero"
      />

      {/* Voice exercises */}
      <Typography variant="overline" style={styles.sectionHeader}>
        {t('exercises.voiceExercises')}
      </Typography>
      {EXERCISE_TYPES.map((ex) => (
        <ExerciseCard
          key={ex.type}
          title={t(ex.titleKey)}
          description={t(ex.descKey)}
          icon={ex.icon}
          onPress={() => router.push(`/exercise/${ex.type}`)}
          accentColor={ex.color}
        />
      ))}

      {/* Timer-based exercises */}
      <Typography variant="overline" style={styles.sectionHeader}>
        {t('exercises.timerExercises')}
      </Typography>
      {TIMED_EXERCISE_TYPES.map((ex) => (
        <ExerciseCard
          key={ex.type}
          title={t(ex.titleKey)}
          description={t(ex.descKey)}
          icon={ex.icon}
          onPress={() => router.push(`/exercise/timed/${ex.type}`)}
          accentColor={ex.color}
        />
      ))}
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
    gap: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.sm,
  },
});
