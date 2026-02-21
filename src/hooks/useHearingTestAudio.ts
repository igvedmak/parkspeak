import { useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { LANGUAGES, resolveLanguage } from '../constants/languages';

let Speech: typeof import('expo-speech') | null = null;

async function getSpeech() {
  if (!Speech) {
    try {
      Speech = await import('expo-speech');
    } catch {
      return null;
    }
  }
  return Speech;
}

// Convert SNR dB to noise volume (0..1) relative to fixed speech level
// At 0 dB SNR, noise = speech level. Negative SNR = noise louder than speech.
function snrToNoiseVolume(snrDb: number): number {
  // speech is at fixed volume ~0.8
  // noise volume = speech / 10^(snr/20)
  const ratio = Math.pow(10, -snrDb / 20);
  return Math.min(1.0, 0.8 * ratio);
}

export function useHearingTestAudio(language: string) {
  const noiseRef = useRef<Audio.Sound | null>(null);

  const startNoise = useCallback(async (snrDb: number) => {
    try {
      // Generate white noise via a short silent base — we'll use expo-av
      // For simplicity, we create a looping noise sound.
      // Since we can't generate noise with expo-av alone, we use a bundled asset.
      // If the asset doesn't exist, we skip noise (degraded test).
      const volume = snrToNoiseVolume(snrDb);
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/speech_noise.wav'),
        { isLooping: true, volume, shouldPlay: true },
      );
      noiseRef.current = sound;
    } catch {
      console.warn('[HearingTest] Noise file not available, running without noise');
    }
  }, []);

  const stopNoise = useCallback(async () => {
    if (noiseRef.current) {
      try {
        await noiseRef.current.stopAsync();
        await noiseRef.current.unloadAsync();
      } catch {}
      noiseRef.current = null;
    }
  }, []);

  const updateNoiseVolume = useCallback(async (snrDb: number) => {
    if (noiseRef.current) {
      const volume = snrToNoiseVolume(snrDb);
      try {
        await noiseRef.current.setVolumeAsync(volume);
      } catch {}
    }
  }, []);

  const speakDigit = useCallback(
    (digit: number): Promise<void> => {
      return new Promise(async (resolve) => {
        const S = await getSpeech();
        if (!S) {
          resolve();
          return;
        }
        const lang = LANGUAGES[resolveLanguage(language)].ttsCode;
        S.speak(String(digit), {
          language: lang,
          rate: 0.8,
          pitch: 1.0,
          onDone: () => resolve(),
          onError: () => resolve(),
          onStopped: () => resolve(),
        });
      });
    },
    [language],
  );

  const playTriplet = useCallback(
    async (digits: [number, number, number], snrDb: number) => {
      await startNoise(snrDb);
      for (let i = 0; i < 3; i++) {
        await speakDigit(digits[i]);
        if (i < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      await stopNoise();
    },
    [startNoise, stopNoise, speakDigit],
  );

  const measureAmbientNoise = useCallback(async (): Promise<number> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return 0;

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

      let samples: number[] = [];
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering != null) {
          samples.push(status.metering);
        }
      });
      recording.setProgressUpdateInterval(200);

      await recording.startAsync();
      await new Promise((r) => setTimeout(r, 3000));

      try {
        await recording.stopAndUnloadAsync();
      } catch {}

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (samples.length === 0) return 0;
      const avgDbfs = samples.reduce((a, b) => a + b, 0) / samples.length;
      // Approximate dB SPL from dBFS (rough conversion, +94 dB offset is typical)
      return Math.max(0, avgDbfs + 94);
    } catch {
      return 0;
    }
  }, []);

  const cleanup = useCallback(async () => {
    await stopNoise();
    const S = await getSpeech();
    if (S) S.stop();
  }, [stopNoise]);

  return { playTriplet, measureAmbientNoise, updateNoiseVolume, cleanup };
}
