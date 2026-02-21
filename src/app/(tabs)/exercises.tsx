import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ExerciseCard } from '../../components/exercise/ExerciseCard';
import { colors, spacing } from '../../constants/theme';
import React from 'react';

const EXERCISE_TYPES = [
  { type: 'phonation', icon: '🔊', titleKey: 'exercises.phonation', descKey: 'exercises.phonationDesc' },
  { type: 'reading', icon: '📖', titleKey: 'exercises.reading', descKey: 'exercises.readingDesc' },
  { type: 'articulation', icon: '🗣', titleKey: 'exercises.articulation', descKey: 'exercises.articulationDesc' },
  { type: 'pitch', icon: '🎵', titleKey: 'exercises.pitch', descKey: 'exercises.pitchDesc' },
  { type: 'functional', icon: '💬', titleKey: 'exercises.functional', descKey: 'exercises.functionalDesc' },
] as const;

const TIMED_EXERCISE_TYPES = [
  { type: 'warmup', icon: '🎤', titleKey: 'exercises.warmup', descKey: 'exercises.warmupDesc' },
  { type: 'breath', icon: '💨', titleKey: 'exercises.breath', descKey: 'exercises.breathDesc' },
  { type: 'facial', icon: '😊', titleKey: 'exercises.facial', descKey: 'exercises.facialDesc' },
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
      {/* Guided session */}
      <ExerciseCard
        title={t('session.startGuided')}
        description={t('session.startGuidedDesc')}
        icon="🎯"
        onPress={() => router.push('/exercise/session')}
      />

      <View style={styles.divider} />

      {/* Voice exercises */}
      {EXERCISE_TYPES.map((ex) => (
        <ExerciseCard
          key={ex.type}
          title={t(ex.titleKey)}
          description={t(ex.descKey)}
          icon={ex.icon}
          onPress={() => router.push(`/exercise/${ex.type}`)}
        />
      ))}

      <View style={styles.divider} />

      {/* Timer-based exercises */}
      {TIMED_EXERCISE_TYPES.map((ex) => (
        <ExerciseCard
          key={ex.type}
          title={t(ex.titleKey)}
          description={t(ex.descKey)}
          icon={ex.icon}
          onPress={() => router.push(`/exercise/timed/${ex.type}`)}
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
