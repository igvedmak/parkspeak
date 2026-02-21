import exercisesEn from '../data/exercises-en.json';
import exercisesHe from '../data/exercises-he.json';

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
};

export function getExercises(language: string, type: ExerciseType): Exercise[] {
  const lang = language === 'he' ? 'he' : 'en';
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
  count: number = 5
): Exercise[] {
  const all = getExercises(language, type);
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

const GENERATION_PROMPTS: Record<ExerciseType, (lang: string) => string> = {
  phonation: () => '', // phonation doesn't need generation
  reading: (lang) =>
    lang === 'he'
      ? 'Generate 5 simple Hebrew sentences (8-15 words each) for speech therapy practice. Mix topics: daily life, weather, family, food, hobbies. Return ONLY a JSON array of strings, no explanation.'
      : 'Generate 5 simple English sentences (8-15 words each) for speech therapy practice. Mix topics: daily life, weather, family, food, hobbies. Return ONLY a JSON array of strings, no explanation.',
  articulation: (lang) =>
    lang === 'he'
      ? 'Generate 5 Hebrew tongue twisters or consonant-heavy phrases for speech articulation practice. Return ONLY a JSON array of strings, no explanation.'
      : 'Generate 5 English tongue twisters or consonant-heavy phrases for speech articulation practice. Return ONLY a JSON array of strings, no explanation.',
  pitch: (lang) =>
    lang === 'he'
      ? 'Generate 5 Hebrew sentences for pitch/emphasis practice. Each should have one word to emphasize. Return ONLY a JSON array of objects with "sentence" and "highlight" fields, no explanation.'
      : 'Generate 5 English sentences for pitch/emphasis practice. Each should have one word to emphasize. Return ONLY a JSON array of objects with "sentence" and "highlight" fields, no explanation.',
  functional: (lang) =>
    lang === 'he'
      ? 'Generate 5 everyday Hebrew phrases people use in real life (restaurant, doctor, phone, family, shopping). Return ONLY a JSON array of objects with "sentence" and "category" fields, no explanation.'
      : 'Generate 5 everyday English phrases people use in real life (restaurant, doctor, phone, family, shopping). Return ONLY a JSON array of objects with "sentence" and "category" fields, no explanation.',
};

function normalizeTarget(text: string): string {
  return text.toLowerCase().replace(/[^\w\s\u0590-\u05FF]/g, '').trim();
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

  const lang = language === 'he' ? 'he' : 'en';
  const prompt = GENERATION_PROMPTS[type](lang);

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
  });

  if (!response.ok) {
    throw new Error(`Generation failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in response');

  const parsed = JSON.parse(jsonMatch[0]);
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
  const lang = language === 'he' ? 'he' : 'en';
  const data = DATA[lang];
  for (const type of Object.keys(data) as ExerciseType[]) {
    const found = data[type].find((e) => e.id === id);
    if (found) return found;
  }
  return null;
}
