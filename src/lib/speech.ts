import { LANGUAGES, resolveLanguage } from '../constants/languages';

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

export async function speakWord(word: string, language: string): Promise<void> {
  const S = await getSpeech();
  if (!S) return;
  S.stop();
  S.speak(word, {
    language: LANGUAGES[resolveLanguage(language)].ttsCode,
    rate: 0.6,
    pitch: 1.0,
  });
}

export async function speakSentence(sentence: string, language: string): Promise<void> {
  const S = await getSpeech();
  if (!S) return;
  S.stop();
  S.speak(sentence, {
    language: LANGUAGES[resolveLanguage(language)].ttsCode,
    rate: 0.75,
    pitch: 1.0,
  });
}

export async function stopSpeech(): Promise<void> {
  const S = await getSpeech();
  if (!S) return;
  S.stop();
}
