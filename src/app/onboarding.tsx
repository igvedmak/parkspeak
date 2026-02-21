import { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { VolumeMeter } from '../components/audio/VolumeMeter';
import { useSessionStore } from '../store/useSessionStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, spacing } from '../constants/theme';
import React from 'react';

type Step = 'welcome' | 'microphone' | 'calibration' | 'done';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setBaselineRms = useSettingsStore((s) => s.setBaselineRms);
  const { setCurrentRms } = useSessionStore();

  const [step, setStep] = useState<Step>('welcome');
  const [micGranted, setMicGranted] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationDone, setCalibrationDone] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const rmsAccumRef = useRef({ sum: 0, count: 0 });

  const requestMic = useCallback(async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    setMicGranted(granted);
    if (granted) {
      setStep('calibration');
    }
  }, []);

  const startCalibration = useCallback(async () => {
    setIsCalibrating(true);
    rmsAccumRef.current = { sum: 0, count: 0 };

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      },
      web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
    });

    recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording && status.metering != null) {
        const linear = Math.pow(10, status.metering / 20);
        setCurrentRms(linear);
        rmsAccumRef.current.sum += linear;
        rmsAccumRef.current.count += 1;
      }
    });
    recording.setProgressUpdateInterval(100);
    await recording.startAsync();
    recordingRef.current = recording;
  }, [setCurrentRms]);

  const stopCalibration = useCallback(async () => {
    const recording = recordingRef.current;
    if (recording) {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;
    }

    const accum = rmsAccumRef.current;
    const avgRms = accum.count > 0 ? accum.sum / accum.count : 0;

    if (avgRms > 0.001) {
      setBaselineRms(avgRms);
      setCalibrationDone(true);
    }

    setIsCalibrating(false);
    setCurrentRms(0);
  }, [setBaselineRms, setCurrentRms]);

  // Cleanup recording if user leaves mid-calibration
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  const finish = useCallback(() => {
    setOnboarded(true);
    router.replace('/');
  }, [setOnboarded, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      {step === 'welcome' && (
        <View style={styles.stepContainer}>
          <Typography variant="heading" align="center">
            {t('onboarding.welcome')}
          </Typography>
          <Typography variant="body" align="center" color={colors.textSecondary}>
            {t('onboarding.welcomeDesc')}
          </Typography>
          <View style={styles.spacer} />
          <Button title={t('common.next')} onPress={() => setStep('microphone')} />
        </View>
      )}

      {step === 'microphone' && (
        <View style={styles.stepContainer}>
          <Typography variant="heading" align="center">
            {t('onboarding.microphone')}
          </Typography>
          <Typography variant="body" align="center" color={colors.textSecondary}>
            {t('onboarding.microphoneDesc')}
          </Typography>
          <View style={styles.spacer} />
          {micGranted ? (
            <Button title={t('common.next')} onPress={() => setStep('calibration')} />
          ) : (
            <Button title={t('onboarding.microphone')} onPress={requestMic} />
          )}
        </View>
      )}

      {step === 'calibration' && (
        <View style={styles.stepContainer}>
          <Typography variant="heading" align="center">
            {t('onboarding.calibration')}
          </Typography>
          <Typography variant="body" align="center" color={colors.textSecondary}>
            {t('onboarding.calibrationDesc')}
          </Typography>

          <Card>
            <Typography variant="bodyLarge" align="center">
              "{t('onboarding.calibrationPhrase')}"
            </Typography>
          </Card>

          <VolumeMeter />

          {isCalibrating && (
            <Typography variant="body" align="center" color={colors.accent}>
              {t('onboarding.speakNow')}
            </Typography>
          )}

          {calibrationDone && (
            <Typography variant="body" align="center" color={colors.success}>
              {t('onboarding.calibrationDone')}
            </Typography>
          )}

          <View style={styles.spacer} />

          {!isCalibrating && !calibrationDone && (
            <Button title={t('common.start')} onPress={startCalibration} />
          )}
          {isCalibrating && (
            <Button title={t('common.stop')} onPress={stopCalibration} variant="secondary" />
          )}
          {calibrationDone && (
            <Button title={t('onboarding.getStarted')} onPress={finish} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  spacer: {
    flex: 1,
  },
});
