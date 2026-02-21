import { resolveLanguage, LANGUAGES } from '../constants/languages';
import exercisesEn from '../data/exercises-en.json';
import exercisesHe from '../data/exercises-he.json';
import exercisesRu from '../data/exercises-ru.json';

export type ExerciseType = 'phonation' | 'reading' | 'articulation' | 'pitch' | 'functional';

export interface Exercise {
  id: string;
  prompt: string;
  target: string | null;
  difficulty: number;
  highlight?: string;
  emotion?: string;
  category?: string;
}

type ExerciseData = Record<ExerciseType, Exercise[]>;

const DATA: Record<string, ExerciseData> = {
  en: exercisesEn as ExerciseData,
  he: exercisesHe as ExerciseData,
  ru: exercisesRu as ExerciseData,
};

export function getExercises(language: string, type: ExerciseType): Exercise[] {
  const lang = resolveLanguage(language);
  return DATA[lang][type] || [];
}

export function getRandomExercise(language: string, type: ExerciseType): Exercise {
  const exercises = getExercises(language, type);
  const index = Math.floor(Math.random() * exercises.length);
  return exercises[index];
}

export function getShuffledExercises(
  language: string,
  type: ExerciseType,
  count: number = 5,
  targetDifficulty?: number
): Exercise[] {
  const all = getExercises(language, type);

  if (targetDifficulty != null) {
    // Weight: 60% target, 30% adjacent (±1), 10% any
    const target = all.filter((e) => e.difficulty === targetDifficulty);
    const adjacent = all.filter((e) => Math.abs(e.difficulty - targetDifficulty) === 1);
    const pool: Exercise[] = [];
    const targetCount = Math.ceil(count * 0.6);
    const adjacentCount = Math.ceil(count * 0.3);
    const anyCount = count - targetCount - adjacentCount;

    pool.push(...shuffle(target).slice(0, targetCount));
    pool.push(...shuffle(adjacent).slice(0, adjacentCount));
    pool.push(...shuffle(all).slice(0, anyCount));

    // Fill remaining if not enough in target/adjacent
    while (pool.length < count && all.length > 0) {
      const random = all[Math.floor(Math.random() * all.length)];
      if (!pool.includes(random)) pool.push(random);
    }
    return shuffle(pool).slice(0, count);
  }

  return shuffle(all).slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function langName(lang: string): string {
  return LANGUAGES[lang as keyof typeof LANGUAGES]?.englishName ?? 'English';
}

const GENERATION_PROMPTS: Record<ExerciseType, (lang: string) => string> = {
  phonation: () => '',
  reading: (lang) =>
    `Generate 5 simple ${langName(lang)} sentences (8-15 words each) for speech therapy practice. Mix topics: daily life, weather, family, food, hobbies. Return ONLY a JSON array of strings, no explanation.`,
  articulation: (lang) =>
    `Generate 5 ${langName(lang)} tongue twisters or consonant-heavy phrases for speech articulation practice. Return ONLY a JSON array of strings, no explanation.`,
  pitch: (lang) =>
    `Generate 5 ${langName(lang)} sentences for pitch/emphasis practice. Each should have one word to emphasize. Return ONLY a JSON array of objects with "sentence" and "highlight" fields, no explanation.`,
  functional: (lang) =>
    `Generate 5 everyday ${langName(lang)} phrases people use in real life (restaurant, doctor, phone, family, shopping). Return ONLY a JSON array of objects with "sentence" and "category" fields, no explanation.`,
};

function normalizeTarget(text: string): string {
  return text.toLowerCase().replace(/[^\w\s\u0590-\u05FF\u0400-\u04FF]/g, '').trim();
}

export async function generateExercises(
  language: string,
  type: ExerciseType,
  apiKey: string,
  count: number = 5
): Promise<Exercise[]> {
  if (type === 'phonation' || !apiKey) {
    return getShuffledExercises(language, type, count);
  }

  const lang = resolveLanguage(language);
  const prompt = GENERATION_PROMPTS[type](lang);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let responseData: any;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.status}`);
    }

    responseData = await response.json();
  } finally {
    clearTimeout(timeout);
  }

  const content = responseData.choices?.[0]?.message?.content?.trim() || '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in response');

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid response: empty or not an array');
  }
  const timestamp = Date.now().toString(36);

  if (type === 'pitch') {
    return parsed.slice(0, count).map((item: { sentence: string; highlight: string }, i: number) => ({
      id: `gen-${timestamp}-${i}`,
      prompt: item.sentence,
      target: normalizeTarget(item.sentence),
      difficulty: 2,
      highlight: item.highlight,
    }));
  }

  if (type === 'functional') {
    return parsed.slice(0, count).map((item: { sentence: string; category: string }, i: number) => ({
      id: `gen-${timestamp}-${i}`,
      prompt: item.sentence,
      target: normalizeTarget(item.sentence),
      difficulty: 1,
      category: item.category,
    }));
  }

  // reading & articulation: simple string array
  return parsed.slice(0, count).map((sentence: string, i: number) => ({
    id: `gen-${timestamp}-${i}`,
    prompt: sentence,
    target: normalizeTarget(sentence),
    difficulty: type === 'articulation' ? 2 : 1,
  }));
}

export function getExerciseById(language: string, id: string): Exercise | null {
  const lang = resolveLanguage(language);
  const data = DATA[lang];
  for (const type of Object.keys(data) as ExerciseType[]) {
    const found = data[type].find((e) => e.id === id);
    if (found) return found;
  }
  return null;
}
