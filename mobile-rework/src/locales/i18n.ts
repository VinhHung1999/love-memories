import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import vi from './vi';

const STORAGE_KEY = '@memoura/lang/v1';

export type AppLang = 'vi' | 'en';

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

function resolveInitialLang(): AppLang {
  const device = Localization.getLocales()?.[0]?.languageCode;
  return device === 'vi' ? 'vi' : 'en';
}

export async function initI18n() {
  let lang: AppLang = 'vi'; // Boss-locked default
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') {
      lang = saved;
    } else {
      lang = resolveInitialLang();
    }
  } catch {
    lang = resolveInitialLang();
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
    returnNull: false,
  });

  return lang;
}

export async function setAppLang(lang: AppLang) {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
