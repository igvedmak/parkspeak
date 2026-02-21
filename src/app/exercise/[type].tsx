import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { VolumeMeter } from '../../components/audio/VolumeMeter';
import { RecordButton } from '../../components/audio/RecordButton';
import { CameraPreview } from '../../components/video/CameraPreview';
import { PromptDisplay } from '../../components/exercise/PromptDisplay';
import { ResultsCard } from '../../components/exercise/ResultsCard';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useSessionStore } from '../../store/useSessionStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { loudnessRatio, getVolumeZone } from '../../lib/audio';
import { calculateIntelligibility, getWordResults, type WordResult } from '../../lib/scoring';
import { AnalysisCard } from '../../components/exercise/AnalysisCard';
import { getShuffledExercises, generateExercises, type ExerciseType, type Exercise } from '../../lib/content';
import { saveAttempt, getRecentAccuracyByType } from '../../lib/database';
import { getTargetDifficulty } from '../../lib/difficulty';
import { stopSpeech } from '../../lib/speech';
import { colors, spacing } from '../../constants/theme';
import React from 'react';

const INSTRUCTION_KEYS: Record<ExerciseType, string> = {
  phonation: 'exercise.holdSound',
  reading: 'exercise.readAloud',
  articulation: 'exercise.speakPhrase',
  pitch: 'exercise.readAloud',
  functional: 'exercise.speakPhrase',
};

type Phase = 'ready' | 'recording' | 'analyzing' | 'results';

export default function ExerciseScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startRecording, stopRecording } = useAudioRecorder();
  const {
    transcribe,
    isReady: isSttReady,
    isTranscribing,
    error: sttError,
  } = useSpeechToText();
  const isRecording = useSessionStore((s) => s.isRecording);
  const recordingDuration = useSessionStore((s) => s.recordingDuration);
  const currentRms = useSessionStore((s) => s.currentRms);
  const baselineRms = useSettingsStore((s) => s.baselineRms);
  const reset = useSessionStore((s) => s.reset);

  const exerciseType = (type as ExerciseType) || 'phonation';
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);
  const hasTargetText = exerciseType !== 'phonation';

  const canGenerate = !!openaiApiKey && exerciseType !== 'phonation';
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  // Load exercises with adaptive difficulty
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const avgAccuracy = await getRecentAccuracyByType(exerciseType).catch(() => null);
      const difficulty = getTargetDifficulty(avgAccuracy);

      if (canGenerate) {
        try {
          const generated = await generateExercises(i18n.language, exerciseType, openaiApiKey, 5);
          if (!cancelled) setExercises(generated);
        } catch (e) {
          console.log('[GEN] Falling back to static exercises:', (e as Error).message);
          if (!cancelled) setExercises(getShuffledExercises(i18n.language, exerciseType, 5, difficulty));
        }
      } else {
        if (!cancelled) setExercises(getShuffledExercises(i18n.language, exerciseType, 5, difficulty));
      }
      if (!cancelled) setIsGenerating(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording().catch(() => {});
      }
      stopSpeech();
      reset();
    };
  }, []);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [showCamera, setShowCamera] = useState(false);
  const [resultLoudness, setResultLoudness] = useState<number | null>(null);
  const [resultIntelligibility, setResultIntelligibility] = useState<number | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [resultDuration, setResultDuration] = useState(0);
  const rmsAccumRef = useRef({ sum: 0, count: 0 });

  const currentExercise: Exercise | undefined = exercises[exerciseIndex];
  if (!currentExercise) {
    return (
      <View style={[styles.container, styles.content]}>
        <Typography variant="body">{t('common.loading')}</Typography>
      </View>
    );
  }

  const handleToggleRecording = async () => {
    if (phase === 'recording') {
      // === STOP RECORDING ===
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

      if (currentExercise.target && isSttReady && uri) {
        setPhase('analyzing');
        try {
          finalText = await transcribe(uri, i18n.language);
          setRecognizedText(finalText);

          finalScore = calculateIntelligibility(finalText, currentExercise.target);
          setResultIntelligibility(finalScore);

          setWordResults(getWordResults(finalText, currentExercise.target));
        } catch (e) {
          console.error('[DEBUG] STT error:', e);
          setResultIntelligibility(null);
        }
      }

      saveAttempt({
        exerciseId: currentExercise.id,
        exerciseType,
        durationSeconds: duration,
        avgLoudness: ratio,
        intelligibility: finalScore,
        recognizedText: finalText,
        targetText: currentExercise.target || '',
        language: i18n.language,
        perception,
      }).catch((e) => console.error('[DB] Failed to save attempt:', e));

      setPhase('results');
    } else {
      // === START RECORDING ===
      reset();
      rmsAccumRef.current = { sum: 0, count: 0 };
      setResultIntelligibility(null);
      setRecognizedText('');
      setPhase('recording');
      await startRecording();
    }
  };

  // Accumulate RMS for average calculation
  if (phase === 'recording' && currentRms > 0) {
    rmsAccumRef.current.sum += currentRms;
    rmsAccumRef.current.count += 1;
  }

  const handleRetry = () => {
    reset();
    setPhase('ready');
    setResultLoudness(null);
    setResultIntelligibility(null);
    setRecognizedText('');
    setWordResults([]);
  };

  const handleNext = () => {
    reset();
    setPhase('ready');
    setResultLoudness(null);
    setResultIntelligibility(null);
    setRecognizedText('');
    setWordResults([]);
    setExerciseIndex((prev) => (prev + 1) % exercises.length);
  };

  const handleDone = () => {
    reset();
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t(`exercises.${exerciseType}`),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {/* API key missing warning */}
        {hasTargetText && !isSttReady && (
          <Card>
            <Typography variant="caption" align="center" color={colors.warning}>
              {t('exercise.addApiKey')}
            </Typography>
          </Card>
        )}

        {/* STT error */}
        {sttError && (
          <Card>
            <Typography variant="caption" align="center" color={colors.error}>
              Speech analysis error: {sttError}
            </Typography>
          </Card>
        )}

        {/* Exercise counter */}
        <Typography variant="caption" align="center">
          {exerciseIndex + 1} / {exercises.length}
          {isGenerating ? '  ...' : ''}
        </Typography>

        {phase === 'analyzing' ? (
          <Card style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Typography variant="body" align="center">
              {t('exercise.analyzing')}
            </Typography>
          </Card>
        ) : phase === 'results' ? (
          <>
            <ResultsCard
              loudnessRatio={resultLoudness}
              intelligibility={resultIntelligibility}
              durationSeconds={resultDuration}
              onRetry={handleRetry}
              onNext={exerciseIndex < exercises.length - 1 ? handleNext : undefined}
              onDone={handleDone}
              requirePerfectScore={hasTargetText}
            />

            {wordResults.length > 0 && (
              <AnalysisCard
                wordResults={wordResults}
                recognizedText={recognizedText}
                targetText={currentExercise.target ?? ''}
              />
            )}

          </>
        ) : (
          <>
            <PromptDisplay
              instruction={t(INSTRUCTION_KEYS[exerciseType])}
              promptText={currentExercise.prompt}
              highlightWord={currentExercise.highlight}
              emotion={currentExercise.emotion}
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
              <RecordButton
                isRecording={isRecording}
                onPress={handleToggleRecording}
              />
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
  buttonArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  analyzingCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  cameraToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
