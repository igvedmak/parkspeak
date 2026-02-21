import { useState, useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { VolumeMeter } from '../../components/audio/VolumeMeter';
import { RecordButton } from '../../components/audio/RecordButton';
import { CameraPreview } from '../../components/video/CameraPreview';
import { PromptDisplay } from '../../components/exercise/PromptDisplay';
import { ResultsCard } from '../../components/exercise/ResultsCard';
import { AnalysisCard } from '../../components/exercise/AnalysisCard';
import { SessionProgress } from '../../components/exercise/SessionProgress';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useSessionStore } from '../../store/useSessionStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { loudnessRatio, getVolumeZone } from '../../lib/audio';
import { calculateIntelligibility, getWordResults, type WordResult } from '../../lib/scoring';
import { getShuffledExercises, type ExerciseType, type Exercise } from '../../lib/content';
import { saveAttempt, createSession, endSession } from '../../lib/database';
import { stopSpeech } from '../../lib/speech';
import { colors, spacing } from '../../constants/theme';
import React from 'react';

interface SessionStep {
  exerciseType: ExerciseType;
  exercise: Exercise;
}

const SESSION_PLAN: Array<{ type: ExerciseType; count: number }> = [
  { type: 'phonation', count: 3 },
  { type: 'pitch', count: 3 },
  { type: 'functional', count: 5 },
  { type: 'reading', count: 2 },
];

const INSTRUCTION_KEYS: Record<ExerciseType, string> = {
  phonation: 'exercise.holdSound',
  reading: 'exercise.readAloud',
  articulation: 'exercise.speakPhrase',
  pitch: 'exercise.readAloud',
  functional: 'exercise.speakPhrase',
};

type Phase = 'ready' | 'recording' | 'analyzing' | 'results' | 'complete';

export default function SessionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startRecording, stopRecording } = useAudioRecorder();
  const { transcribe, isReady: isSttReady } = useSpeechToText();
  const isRecording = useSessionStore((s) => s.isRecording);
  const recordingDuration = useSessionStore((s) => s.recordingDuration);
  const currentRms = useSessionStore((s) => s.currentRms);
  const baselineRms = useSettingsStore((s) => s.baselineRms);
  const reset = useSessionStore((s) => s.reset);

  const [steps, setSteps] = useState<SessionStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [resultLoudness, setResultLoudness] = useState<number | null>(null);
  const [resultIntelligibility, setResultIntelligibility] = useState<number | null>(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [resultDuration, setResultDuration] = useState(0);
  const rmsAccumRef = useRef({ sum: 0, count: 0 });

  // Accumulate session totals
  const totalsRef = useRef({ count: 0, loudnessSum: 0, loudnessCount: 0, intelligibilitySum: 0, intelligibilityCount: 0 });

  // Build exercise queue on mount
  useEffect(() => {
    const queue: SessionStep[] = [];
    for (const { type, count } of SESSION_PLAN) {
      const exercises = getShuffledExercises(i18n.language, type, count);
      for (const exercise of exercises) {
        queue.push({ exerciseType: type, exercise });
      }
    }
    setSteps(queue);

    createSession('guided').then(setSessionId).catch(console.error);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) stopRecording().catch(() => {});
      stopSpeech();
      reset();
    };
  }, []);

  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;

  const handleToggleRecording = async () => {
    if (phase === 'recording') {
      if (!currentStep) return;
      const uri = await stopRecording();
      const accum = rmsAccumRef.current;
      const avgRms = accum.count > 0 ? accum.sum / accum.count : 0;
      const ratio = baselineRms ? loudnessRatio(avgRms, baselineRms) : null;
      const duration = recordingDuration;
      setResultLoudness(ratio);
      setResultDuration(duration);

      // Auto-detect perception from volume zone
      const zone = ratio != null ? getVolumeZone(ratio) : 'quiet';
      const perception = zone === 'good' ? 'right' : zone;

      let finalText = '';
      let finalScore: number | null = null;

      if (currentStep.exercise.target && isSttReady && uri) {
        setPhase('analyzing');
        try {
          finalText = await transcribe(uri, i18n.language);
          setRecognizedText(finalText);
          finalScore = calculateIntelligibility(finalText, currentStep.exercise.target);
          setResultIntelligibility(finalScore);
          setWordResults(getWordResults(finalText, currentStep.exercise.target));
        } catch {
          setResultIntelligibility(null);
        }
      }

      // Update totals
      totalsRef.current.count++;
      if (ratio != null) { totalsRef.current.loudnessSum += ratio; totalsRef.current.loudnessCount++; }
      if (finalScore != null) { totalsRef.current.intelligibilitySum += finalScore; totalsRef.current.intelligibilityCount++; }

      saveAttempt({
        exerciseId: currentStep.exercise.id,
        exerciseType: currentStep.exerciseType,
        sessionId: sessionId ?? undefined,
        durationSeconds: duration,
        avgLoudness: ratio,
        intelligibility: finalScore,
        recognizedText: finalText,
        targetText: currentStep.exercise.target || '',
        language: i18n.language,
        perception,
      }).catch(console.error);

      setPhase('results');
    } else {
      reset();
      rmsAccumRef.current = { sum: 0, count: 0 };
      setResultIntelligibility(null);
      setRecognizedText('');
      setPhase('recording');
      await startRecording();
    }
  };

  if (phase === 'recording' && currentRms > 0) {
    rmsAccumRef.current.sum += currentRms;
    rmsAccumRef.current.count += 1;
  }

  const handleNext = () => {
    reset();
    setResultLoudness(null);
    setResultIntelligibility(null);
    setRecognizedText('');
    setWordResults([]);

    if (stepIndex + 1 >= totalSteps) {
      if (sessionId) endSession(sessionId, totalsRef.current.count).catch(console.error);
      setPhase('complete');
    } else {
      setStepIndex((prev) => prev + 1);
      setPhase('ready');
    }
  };

  const handleRetry = () => {
    reset();
    setPhase('ready');
    setResultLoudness(null);
    setResultIntelligibility(null);
    setRecognizedText('');
    setWordResults([]);
  };

  const handleDone = () => {
    if (sessionId) endSession(sessionId, totalsRef.current.count).catch(console.error);
    reset();
    router.back();
  };

  if (steps.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const totals = totalsRef.current;
  const avgLoudness = totals.loudnessCount > 0 ? totals.loudnessSum / totals.loudnessCount : null;
  const avgIntelligibility = totals.intelligibilityCount > 0 ? totals.intelligibilitySum / totals.intelligibilityCount : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('session.title'),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <SessionProgress currentStep={stepIndex + 1} totalSteps={totalSteps} />

        {phase === 'complete' ? (
          <Card style={styles.summaryCard}>
            <Typography variant="heading" align="center" color={colors.success}>
              {t('session.complete')}
            </Typography>
            <Typography variant="body" align="center" color={colors.textSecondary}>
              {t('session.greatWork')}
            </Typography>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Typography variant="title" color={colors.accent}>{totals.count}</Typography>
                <Typography variant="caption">{t('session.exercisesCompleted')}</Typography>
              </View>
              {avgLoudness != null && (
                <View style={styles.summaryItem}>
                  <Typography variant="title" color={colors.accent}>{avgLoudness.toFixed(1)}x</Typography>
                  <Typography variant="caption">{t('session.avgLoudness')}</Typography>
                </View>
              )}
              {avgIntelligibility != null && (
                <View style={styles.summaryItem}>
                  <Typography variant="title" color={colors.accent}>{Math.round(avgIntelligibility)}%</Typography>
                  <Typography variant="caption">{t('session.avgClarity')}</Typography>
                </View>
              )}
            </View>
            <Button title={t('common.done')} onPress={handleDone} variant="primary" />
          </Card>
        ) : phase === 'analyzing' ? (
          <Card style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Typography variant="body" align="center">{t('exercise.analyzing')}</Typography>
          </Card>
        ) : phase === 'results' ? (
          <>
            <ResultsCard
              loudnessRatio={resultLoudness}
              intelligibility={resultIntelligibility}
              durationSeconds={resultDuration}
              onRetry={handleRetry}
              onNext={handleNext}
              onDone={handleDone}
              requirePerfectScore={!!currentStep?.exercise.target}
            />
            {wordResults.length > 0 && (
              <AnalysisCard wordResults={wordResults} recognizedText={recognizedText} targetText={currentStep?.exercise.target ?? ''} />
            )}
          </>
        ) : currentStep ? (
          <>
            <PromptDisplay
              instruction={t(INSTRUCTION_KEYS[currentStep.exerciseType])}
              promptText={currentStep.exercise.prompt}
              highlightWord={currentStep.exercise.highlight}
              emotion={currentStep.exercise.emotion}
            />

            {showCamera ? (
              <CameraPreview
                isRecording={isRecording}
                onToggle={() => setShowCamera(false)}
              />
            ) : (
              <Pressable
                style={styles.cameraToggle}
                onPress={() => setShowCamera(true)}
                accessibilityRole="button"
                accessibilityLabel={t('camera.enable')}
              >
                <Ionicons name="videocam-outline" size={20} color={colors.accent} />
                <Typography variant="caption" color={colors.accent}>
                  {t('camera.enable')}
                </Typography>
              </Pressable>
            )}

            <VolumeMeter />
            {phase === 'recording' && (
              <Typography variant="body" align="center" color={colors.textSecondary}>
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </Typography>
            )}
            <View style={styles.buttonArea}>
              <RecordButton isRecording={isRecording} onPress={handleToggleRecording} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  buttonArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  analyzingCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  summaryCard: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  cameraToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
