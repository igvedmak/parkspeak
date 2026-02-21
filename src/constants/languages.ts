export type AppLanguage = 'en' | 'he' | 'ru';

export interface LanguageConfig {
  code: AppLanguage;
  label: string;
  englishName: string;
  rtl: boolean;
  whisperCode: string;
  ttsCode: string;
  pronunciationTip: (word: string) => string;
}

export const LANGUAGES: Record<AppLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    label: 'English',
    englishName: 'English',
    rtl: false,
    whisperCode: 'en',
    ttsCode: 'en-US',
    pronunciationTip: (word) => {
      const hasCluster = /[bcdfghjklmnpqrstvwxyz]{3,}/i.test(word);
      const hasInitialCluster = /^[bcdfghjklmnpqrstvwxyz]{2,}/i.test(word);
      const hasFinalCluster = /[bcdfghjklmnpqrstvwxyz]{2,}$/i.test(word);
      if (hasCluster) return `"${word}" has a consonant cluster — slow down and exaggerate each consonant sound`;
      if (hasInitialCluster) return `"${word}" starts with blended consonants — say each sound separately, then blend`;
      if (hasFinalCluster) return `"${word}" ends with consonants — make sure you pronounce the final sounds clearly`;
      if (word.length >= 8) return `Break "${word}" into syllables: say each part loudly and clearly before combining`;
      return `Say "${word}" slowly, open your mouth wide, and project your voice`;
    },
  },
  he: {
    code: 'he',
    label: 'עברית',
    englishName: 'Hebrew',
    rtl: true,
    whisperCode: 'he',
    ttsCode: 'he-IL',
    pronunciationTip: (word) => {
      const hasResh = /ר/.test(word);
      const hasChet = /[חכ]/.test(word);
      if (hasResh) return `"${word}" — הדגש את האות ר׳, פתח את הפה ואמור בקול רם`;
      if (hasChet) return `"${word}" — הדגש את הצלילים הגרוניים, אמור לאט ובבירור`;
      if (word.length >= 6) return `חלק את "${word}" להברות, אמור כל הברה בנפרד ובקול רם`;
      return `אמור "${word}" לאט, פתח את הפה היטב ודבר בקול רם`;
    },
  },
  ru: {
    code: 'ru',
    label: 'Русский',
    englishName: 'Russian',
    rtl: false,
    whisperCode: 'ru',
    ttsCode: 'ru-RU',
    pronunciationTip: (word) => {
      const hasSibilant = /[шщжч]/i.test(word);
      const hasCluster = /[бвгджзклмнпрстфхцчшщ]{3,}/i.test(word);
      if (hasCluster) return `В "${word}" есть стечение согласных — произнесите каждый звук отдельно и чётко`;
      if (hasSibilant) return `"${word}" — чётко артикулируйте шипящие звуки, широко открывая рот`;
      if (word.length >= 8) return `Разбейте "${word}" на слоги и произнесите каждый громко и отчётливо`;
      return `Произнесите "${word}" медленно, широко открывая рот, и говорите громче`;
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
