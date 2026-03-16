/**
 * i18n setup — i18next with react-native-localize detector.
 *
 * Language detection order:
 *   1. AsyncStorage persisted choice (key: 'app_language')
 *   2. Device locale via react-native-localize
 *   3. Fallback: 'en'
 *
 * Init BEFORE NavigationContainer renders (called at the top of App.tsx).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en';
import vi from '../locales/vi';

const LANGUAGE_STORAGE_KEY = 'app_language';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

/** Supported locale codes */
export type AppLanguage = 'en' | 'vi';

/** Read persisted user choice from AsyncStorage */
async function getPersistedLanguage(): Promise<AppLanguage | null> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (lang === 'en' || lang === 'vi') return lang;
  } catch {
    // ignore
  }
  return null;
}

/** Detect best language from device locale list */
function detectDeviceLanguage(): AppLanguage {
  const locales = RNLocalize.getLocales();
  for (const locale of locales) {
    const lang = locale.languageCode;
    if (lang === 'vi') return 'vi';
    if (lang === 'en') return 'en';
  }
  return 'en';
}

/**
 * Persist user's language choice.
 * Call this when the user changes language in the Profile screen.
 */
export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

/**
 * Initialise i18next. Returns a promise that resolves when ready.
 * Awaited in App.tsx before the NavigationContainer mounts.
 */
export async function initI18n(): Promise<void> {
  const persisted = await getPersistedLanguage();
  const lng = persisted ?? detectDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng,
      fallbackLng: 'en',
      interpolation: {
        // React Native renders JSX, not HTML — no escaping needed
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
}

export default i18n;
