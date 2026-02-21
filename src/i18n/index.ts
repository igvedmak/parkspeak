import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import { LANGUAGES, resolveLanguage, type AppLanguage } from '../constants/languages';
import en from './en.json';
import he from './he.json';
import ru from './ru.json';

const translations: Record<AppLanguage, object> = { en, he, ru };

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
const initialLang = resolveLanguage(deviceLocale);

const resources = Object.fromEntries(
  Object.keys(translations).map((lang) => [lang, { translation: translations[lang as AppLanguage] }])
);

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lang: AppLanguage) {
  i18n.changeLanguage(lang);
  const isRTL = LANGUAGES[lang].rtl;
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);
  }
}

export default i18n;
