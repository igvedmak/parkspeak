import { useState, useCallback } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { transcribeAudio } from '../lib/stt';

export function useSpeechToText() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);

  const isReady = !!openaiApiKey;

  const transcribe = useCallback(
    async (audioUri: string, language: string = 'en'): Promise<string> => {
      if (!openaiApiKey) {
        setError('OpenAI API key is required. Add it in Settings.');
        return '';
      }

      setIsTranscribing(true);
      setError(null);

      try {
        console.log('[STT] Sending audio to OpenAI...', { audioUri, language });
        const text = await transcribeAudio(audioUri, language, openaiApiKey);
        console.log('[STT] Result:', JSON.stringify(text));
        return text;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transcription failed';
        setError(msg);
        console.error('[STT] Error:', e);
        return '';
      } finally {
        setIsTranscribing(false);
      }
    },
    [openaiApiKey]
  );

  return {
    transcribe,
    isReady,
    isTranscribing,
    error,
  };
}
