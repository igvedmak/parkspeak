import { resolveLanguage } from '../constants/languages';
import timedEn from '../data/timed-exercises-en.json';
import timedHe from '../data/timed-exercises-he.json';
import timedRu from '../data/timed-exercises-ru.json';

export type TimedExerciseType = 'breath' | 'facial' | 'warmup';

export interface TimedExercise {
  id: string;
  prompt: string;
  instruction: string;
  durationSeconds: number | null;
  metric?: string;
  category?: string;
  difficulty: number;
}

type TimedData = Record<TimedExerciseType, TimedExercise[]>;

const DATA: Record<string, TimedData> = {
  en: timedEn as TimedData,
  he: timedHe as TimedData,
  ru: timedRu as TimedData,
};

export function getTimedExercises(language: string, type: TimedExerciseType): TimedExercise[] {
  const lang = resolveLanguage(language);
  return DATA[lang]?.[type] || DATA.en[type] || [];
}

export function getShuffledTimedExercises(
  language: string,
  type: TimedExerciseType,
  count?: number
): TimedExercise[] {
  const all = getTimedExercises(language, type);

  // Warmup exercises should not be shuffled — they follow a fixed sequence
  if (type === 'warmup') return count ? all.slice(0, count) : all;

  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return count ? shuffled.slice(0, count) : shuffled;
}

export function computeSZRatio(sDuration: number, zDuration: number): number {
  if (zDuration === 0) return 0;
  return sDuration / zDuration;
}
