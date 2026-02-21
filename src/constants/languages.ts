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
      const w = word.toLowerCase();
      if (/th/.test(w)) return `"${word}" — place your tongue tip between your upper and lower teeth, blow air out, and feel the vibration`;
      if (/sh|ch/.test(w)) return `"${word}" — round your lips forward, lift your tongue wide behind the ridge above your upper teeth, push air through`;
      if (/[pbm]/.test(w)) return `"${word}" — press both lips firmly together, build up air pressure, then release with a strong burst`;
      if (/[fv]/.test(w)) return `"${word}" — gently bite your lower lip with your upper teeth and blow air through the gap`;
      if (/[td]/.test(w)) return `"${word}" — press your tongue tip firmly against the bumpy ridge just behind your upper teeth, then release sharply`;
      if (/[sz]/.test(w)) return `"${word}" — point your tongue tip just behind your upper teeth, keep a narrow gap, and push a steady stream of air through`;
      if (/[kg]/.test(w)) return `"${word}" — push the back of your tongue up firmly against the soft part of the roof of your mouth, then release`;
      if (/r/.test(w)) return `"${word}" — curl your tongue tip slightly back without touching the roof of your mouth, keep your lips slightly rounded`;
      if (/l/.test(w)) return `"${word}" — press your tongue tip against the ridge behind your upper teeth, let air flow around the sides of your tongue`;
      if (w.length >= 8) return `Break "${word}" into syllables — say each part separately and loudly, exaggerate every mouth movement, then combine`;
      return `"${word}" — open your jaw wide, exaggerate every lip and tongue movement, speak loudly from your belly`;
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
      if (/[בפמ]/.test(word)) return `"${word}" — לחץ את שתי השפתיים חזק זו לזו, בנה לחץ אוויר ושחרר בפיצוץ חד`;
      if (/[תד]/.test(word)) return `"${word}" — לחץ את קצה הלשון חזק מאחורי השיניים העליונות ושחרר בחדות`;
      if (/[שׂסזצ]/.test(word)) return `"${word}" — כוון את קצה הלשון מאחורי השיניים העליונות, השאר מרווח צר ודחוף זרם אוויר יציב`;
      if (/ר/.test(word)) return `"${word}" — הרם את גב הלשון לכיוון החך הרך, הרגש את הרטט בגרון, פתח את הפה`;
      if (/[חכך]/.test(word)) return `"${word}" — הרם את גב הלשון לחך הרך, דחוף אוויר דרך הגרון, הרגש את החיכוך`;
      if (/[עה]/.test(word)) return `"${word}" — פתח את הגרון רחב, דחוף אוויר מהבטן, הגזם בתנועת הלסת`;
      if (/[קג]/.test(word)) return `"${word}" — לחץ את גב הלשון חזק לחלק הרך של תקרת הפה ושחרר`;
      if (/[נל]/.test(word)) return `"${word}" — לחץ את קצה הלשון לגבעה שמאחורי השיניים העליונות, תן לאוויר לזרום בצדדים`;
      if (word.length >= 6) return `חלק את "${word}" להברות — אמור כל חלק בנפרד ובקול, הגזם בכל תנועת פה, ואז חבר`;
      return `"${word}" — פתח את הלסת רחב, הגזם בכל תנועת שפתיים ולשון, דבר בקול מהבטן`;
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
      const w = word.toLowerCase();
      if (/[шщ]/.test(w)) return `"${word}" — вытяните губы вперёд трубочкой, поднимите широкий язык к нёбу за верхними зубами, протолкните воздух`;
      if (/ж/.test(w)) return `"${word}" — округлите губы, поднимите язык к нёбу, добавьте голос — почувствуйте вибрацию`;
      if (/ч/.test(w)) return `"${word}" — прижмите кончик языка к бугоркам за верхними зубами, затем резко отпустите с потоком воздуха`;
      if (/р/.test(w)) return `"${word}" — поднимите кончик языка к бугоркам за верхними зубами, выдохните сильно — язык должен завибрировать`;
      if (/[бпм]/.test(w)) return `"${word}" — плотно сожмите обе губы, создайте давление воздуха и резко разомкните`;
      if (/[фв]/.test(w)) return `"${word}" — слегка прикусите нижнюю губу верхними зубами и продуйте воздух через щель`;
      if (/[тд]/.test(w)) return `"${word}" — прижмите кончик языка к верхним зубам с силой, затем резко оторвите`;
      if (/[сз]/.test(w)) return `"${word}" — направьте кончик языка к верхним зубам, оставьте узкую щель и выпускайте ровную струю воздуха`;
      if (/[кг]/.test(w)) return `"${word}" — прижмите заднюю часть языка к мягкому нёбу и резко отпустите`;
      if (/л/.test(w)) return `"${word}" — прижмите кончик языка к бугоркам за верхними зубами, пропустите воздух по бокам языка`;
      if (w.length >= 8) return `Разбейте "${word}" на слоги — произнесите каждый отдельно и громко, утрируйте движения рта, затем соедините`;
      return `"${word}" — широко откройте челюсть, утрируйте каждое движение губ и языка, говорите громко от живота`;
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
