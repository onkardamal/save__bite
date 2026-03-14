import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';
import mrCommon from './locales/mr/common.json';

const STORAGE_KEY = 'savebite_lang';

const resources = {
  en: {
    common: enCommon,
  },
  hi: {
    common: hiCommon,
  },
  mr: {
    common: mrCommon,
  },
};

export const setupI18n = () => {
  if (!i18n.isInitialized) {
    const savedLang = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || 'hi';

    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: savedLang,
        fallbackLng: 'en',
        ns: ['common'],
        defaultNS: 'common',
        interpolation: {
          escapeValue: false,
        },
      })
      .catch((err) => {
        console.error('i18n init error', err);
      });
  }
};

export const changeLanguage = (lang: 'en' | 'hi' | 'mr') => {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
};

export default i18n;

