import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DigitPad } from '../components/hearing/DigitPad';
import { useHearingTestAudio } from '../hooks/useHearingTestAudio';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  createInitialState,
  addNextTrial,
  scoreTrial,
  TOTAL_TRIPLETS,
  type HearingTestState,
  type HearingResult,
} from '../lib/hearingTest';
import { saveHearingTest } from '../lib/database';
import { colors, spacing, borderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HearingTestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const setHearingResult = useSettingsStore((s) => s.setHearingResult);
  const setHearingTestedAt = useSettingsStore((s) => s.setHearingTestedAt);

  const [state, setState] = useState<HearingTestState>(createInitialState);
  const [inputDigits, setInputDigits] = useState<(number | null)[]>([null, null, null]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambientDb, setAmbientDb] = useState<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { playTriplet, measureAmbientNoise, cleanup } = useHearingTestAudio(language);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  const handleStartAmbientCheck = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'ambient_check' }));
    const db = await measureAmbientNoise();
    setAmbientDb(db);
  }, [measureAmbientNoise]);

  const handleStartTest = useCallback(() => {
    const withTrial = addNextTrial({ ...stateRef.current, phase: 'running' });
    setState(withTrial);
  }, []);

  const playCurrentTriplet = useCallback(async (testState: HearingTestState) => {
    const trial = testState.trials[testState.trials.length - 1];
    if (!trial) return;
    setIsPlaying(true);
    await playTriplet(trial.digits, trial.snrDb);
    setIsPlaying(false);
  }, [playTriplet]);

  useEffect(() => {
    if (state.phase === 'running' && state.trials.length > 0) {
      const lastTrial = state.trials[state.trials.length - 1];
      if (lastTrial.response === null) {
        playCurrentTriplet(state);
      }
    }
  }, [state.trials.length, state.phase, playCurrentTriplet]);

  const handleDigit = useCallback((d: number) => {
    setInputDigits((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((v) => v === null);
      if (emptyIdx !== -1) {
        next[emptyIdx] = d;
      }
      return next;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setInputDigits((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i] !== null) {
          next[i] = null;
          break;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (inputDigits.every((d) => d !== null) && state.phase === 'running') {
      const response = inputDigits as [number, number, number];
      const scored = scoreTrial(state, response);
      setInputDigits([null, null, null]);

      if (scored.phase === 'complete') {
        setState(scored);
        if (scored.result && scored.srtDb !== null) {
          setHearingResult(scored.result);
          setHearingTestedAt(new Date().toISOString());
          saveHearingTest({
            srtDb: scored.srtDb,
            result: scored.result,
            trialsJson: JSON.stringify(scored.trials),
            ambientNoiseDb: ambientDb,
            language,
          });
        }
      } else {
        const next = addNextTrial(scored);
        setState(next);
      }
    }
  }, [inputDigits, state, ambientDb, language, setHearingResult, setHearingTestedAt]);

  const trialNumber = state.trials.length;

  // --- Instructions Phase ---
  if (state.phase === 'instructions') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Typography variant="heading">{t('hearing.title')}</Typography>
        <Card style={styles.infoCard}>
          <Ionicons name="headset-outline" size={48} color={colors.accent} style={styles.icon} />
          <Typography variant="body">{t('hearing.description')}</Typography>
          <Typography variant="body" color={colors.textSecondary}>
            {t('hearing.useHeadphones')}
          </Typography>
        </Card>
        <Card style={styles.disclaimerCard}>
          <Typography variant="caption" color={colors.textSecondary}>
            {t('hearing.disclaimer')}
          </Typography>
        </Card>
        <Button title={t('common.start')} onPress={handleStartAmbientCheck} />
        <Button title={t('common.back')} onPress={() => router.back()} variant="outline" />
      </ScrollView>
    );
  }

  // --- Ambient Check Phase ---
  if (state.phase === 'ambient_check') {
    const tooNoisy = ambientDb !== null && ambientDb > 50;
    const ready = ambientDb !== null && !tooNoisy;
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Typography variant="heading">{t('hearing.title')}</Typography>
        <Card style={styles.infoCard}>
          {ambientDb === null ? (
            <>
              <Ionicons name="mic-outline" size={48} color={colors.accent} style={styles.icon} />
              <Typography variant="body">{t('hearing.ambientCheck')}</Typography>
            </>
          ) : tooNoisy ? (
            <>
              <Ionicons name="warning-outline" size={48} color={colors.warning} style={styles.icon} />
              <Typography variant="body" color={colors.warning}>
                {t('hearing.tooNoisy')}
              </Typography>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} style={styles.icon} />
              <Typography variant="body" color={colors.success}>
                {t('hearing.quietEnough')}
              </Typography>
            </>
          )}
        </Card>
        {ready && (
          <Button title={t('common.start')} onPress={handleStartTest} />
        )}
        {tooNoisy && (
          <Button title={t('common.retry')} onPress={handleStartAmbientCheck} />
        )}
      </ScrollView>
    );
  }

  // --- Complete Phase ---
  if (state.phase === 'complete' && state.result) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Typography variant="heading">{t('hearing.title')}</Typography>
        <ResultCard result={state.result} t={t} />
        <Button title={t('hearing.retakeTest')} onPress={() => setState(createInitialState())} variant="outline" />
        <Button title={t('common.done')} onPress={() => router.back()} />
      </ScrollView>
    );
  }

  // --- Running Phase ---
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.runningContent}>
        <Typography variant="body" align="center" color={colors.textSecondary}>
          {t('hearing.trial', { current: trialNumber, total: TOTAL_TRIPLETS })}
        </Typography>

        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${(trialNumber / TOTAL_TRIPLETS) * 100}%` }]}
          />
        </View>

        {isPlaying ? (
          <Card style={styles.listeningCard}>
            <Ionicons name="volume-high-outline" size={48} color={colors.accent} />
            <Typography variant="body" align="center">
              {t('hearing.listenCarefully')}
            </Typography>
          </Card>
        ) : (
          <Typography variant="body" align="center">
            {t('hearing.listenCarefully')}
          </Typography>
        )}

        <DigitPad
          digits={inputDigits}
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          disabled={isPlaying}
        />
      </View>
    </View>
  );
}

function ResultCard({ result, t }: { result: HearingResult; t: (key: string) => string }) {
  const config = {
    normal: {
      icon: 'checkmark-circle' as const,
      color: colors.success,
      bg: colors.successLight,
    },
    borderline: {
      icon: 'alert-circle' as const,
      color: colors.warning,
      bg: colors.warningLight,
    },
    refer: {
      icon: 'warning' as const,
      color: colors.error,
      bg: colors.errorLight,
    },
  };
  const c = config[result];
  return (
    <Card style={{ ...styles.resultCard, backgroundColor: c.bg }}>
      <Ionicons name={c.icon} size={56} color={c.color} />
      <Typography variant="title" color={c.color}>
        {t(`hearing.${result}`)}
      </Typography>
      <Typography variant="body" align="center">
        {t(`hearing.${result}Desc`)}
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
  runningContent: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  infoCard: {
    gap: spacing.md,
    alignItems: 'center',
  },
  disclaimerCard: {
    backgroundColor: colors.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  icon: {
    alignSelf: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  listeningCard: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentLight,
  },
  resultCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
});
