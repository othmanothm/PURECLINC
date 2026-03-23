import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Cookies from 'js-cookie';
import ar from './ar.json';
import en from './en.json';

// Get saved language from cookie or default to 'en'
const savedLanguage = Cookies.get('pureskin_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: ar,
      },
      en: {
        translation: en,
      },
    },
    lng: savedLanguage, // Use saved language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
    debug: false, // Set to true for debugging
  });

// Listen for language changes to ensure components re-render
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});

export default i18n;

