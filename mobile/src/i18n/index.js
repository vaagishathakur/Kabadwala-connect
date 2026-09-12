import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import hi from './hi.json';
import mr from './mr.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      hi: { translation: hi },
      mr: { translation: mr }
    },
    lng: 'hi', // default language
    fallbackLng: 'hi',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
