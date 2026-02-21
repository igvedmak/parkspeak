import { LANGUAGES, resolveLanguage } from '../constants/languages';

/**
 * Calculate word-level accuracy between recognized text and target text.
 * Returns a score from 0 to 100.
 */
export function calculateIntelligibility(
  recognized: string,
  target: string
): number {
  const recognizedWords = normalizeText(recognized);
  const targetWords = normalizeText(target);

  if (targetWords.length === 0) return 0;

  // Frequency map so duplicate words (e.g. "I ... I") are counted correctly
  const counts = new Map<string, number>();
  for (const w of recognizedWords) {
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  let matches = 0;
  for (const word of targetWords) {
    const c = counts.get(word) ?? 0;
    if (c > 0) {
      matches++;
      counts.set(word, c - 1);
    }
  }

  return Math.round((matches / targetWords.length) * 100);
}

export interface WordResult {
  targetWord: string;
  matched: boolean;
}

export function getWordResults(
  recognized: string,
  target: string
): WordResult[] {
  const counts = new Map<string, number>();
  for (const w of normalizeText(recognized)) {
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return normalizeText(target).map((word) => {
    const c = counts.get(word) ?? 0;
    if (c > 0) {
      counts.set(word, c - 1);
      return { targetWord: word, matched: true };
    }
    return { targetWord: word, matched: false };
  });
}

export function getPronunciationTip(word: string, language: string): string {
  return LANGUAGES[resolveLanguage(language)].pronunciationTip(word);
}

function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0590-\u05FF\u0400-\u04FF]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}
