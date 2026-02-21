import { useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useSessionStore } from '../store/useSessionStore';

// M4A/AAC on Android (reliable format that OpenAI Whisper API accepts)
// WAV/PCM on iOS (native support)
const RECORDING_OPTIONS: Audio.RecordingOptions = {
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
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setRecording, setRecordingDuration, setAudioUri, setCurrentRms } =
    useSessionStore();

  const startRecording = useCallback(async () => {
    try {
      // Clean up any leftover recording from a previous session
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // Ignore — may already be unloaded
        }
        recordingRef.current = null;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering != null) {
          // expo-av metering is in dBFS (negative values, 0 = max)
          // Convert to a 0..1 linear scale for the volume meter
          const dbfs = status.metering;
          const linear = Math.pow(10, dbfs / 20);
          setCurrentRms(linear);
        }
      });
      recording.setProgressUpdateInterval(100);

      await recording.startAsync();

      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      setRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [setRecording, setRecordingDuration, setCurrentRms]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    const recording = recordingRef.current;
    if (!recording) return null;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      recordingRef.current = null;
      setRecording(false);
      setCurrentRms(0);
      setAudioUri(uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecording(false);
      setCurrentRms(0);
      return null;
    }
  }, [setRecording, setAudioUri, setCurrentRms]);

  return { startRecording, stopRecording };
}
