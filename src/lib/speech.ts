import { LANGUAGES, resolveLanguage } from '../constants/languages';
import { useSettingsStore } from '../store/useSettingsStore';

let Speech: typeof import('expo-speech') | null = null;

async function getSpeech() {
  if (!Speech) {
    try {
      Speech = await import('expo-speech');
    } catch {
      console.warn('[Speech] Native module not available');
      return null;
    }
  }
  return Speech;
}

function getHearingRateAdjustment(): number {
  const result = useSettingsStore.getState().hearingResult;
  if (result === 'refer') return -0.2;
  if (result === 'borderline') return -0.1;
  return 0;
}

export async function speakWord(word: string, language: string): Promise<void> {
  const S = await getSpeech();
  if (!S) return;
  S.stop();
  const adj = getHearingRateAdjustment();
  S.speak(word, {
    language: LANGUAGES[resolveLanguage(language)].ttsCode,
    rate: Math.max(0.3, 0.6 + adj),
    pitch: 1.0,
  });
}

export async function speakSentence(sentence: string, language: string): Promise<void> {
  const S = await getSpeech();
  if (!S) return;
  S.stop();
  const adj = getHearingRateAdjustment();
  S.speak(sentence, {
    language: LANGUAGES[resolveLanguage(language)].ttsCode,
    rate: Math.max(0.3, 0.75 + adj),
    pitch: 1.0,
  });
}

export async function stopSpeech(): Promise<void> {
  const S = await getSpeech();
  if (!S) return;
  S.stop();
}
