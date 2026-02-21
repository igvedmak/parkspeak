export type AppLanguage = 'en' | 'he' | 'ru';

export interface LanguageConfig {
  code: AppLanguage;
  label: string;
  englishName: string;
  rtl: boolean;
  whisperCode: string;
  pronunciationTip: (word: string) => string;
}

export const LANGUAGES: Record<AppLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    label: 'English',
    englishName: 'English',
    rtl: false,
    whisperCode: 'en',
    pronunciationTip: (word) => {
      const hasCluster = /[bcdfghjklmnpqrstvwxyz]{2,}/i.test(word);
      if (hasCluster) return `Slow down on "${word}" — exaggerate each consonant`;
      if (word.length >= 8) return `Break "${word}" into syllables and say each one clearly`;
      return `Try saying "${word}" slowly and with more volume`;
    },
  },
  he: {
    code: 'he',
    label: 'עברית',
    englishName: 'Hebrew',
    rtl: true,
    whisperCode: 'he',
    pronunciationTip: (word) =>
      `נסה להגיד "${word}" לאט יותר, תוך הדגשת כל הברה`,
  },
  ru: {
    code: 'ru',
    label: 'Русский',
    englishName: 'Russian',
    rtl: false,
    whisperCode: 'ru',
    pronunciationTip: (word) => {
      if (word.length >= 8) return `Разбейте "${word}" на слоги и произнесите каждый чётко`;
      return `Попробуйте произнести "${word}" медленно и громче`;
    },
  },
};

export const LANGUAGE_ORDER: AppLanguage[] = ['en', 'he', 'ru'];

export function resolveLanguage(lang: string): AppLanguage {
  return lang in LANGUAGES ? (lang as AppLanguage) : 'en';
}

export function nextLanguage(current: AppLanguage): AppLanguage {
  const idx = LANGUAGE_ORDER.indexOf(current);
  return LANGUAGE_ORDER[(idx + 1) % LANGUAGE_ORDER.length];
}
