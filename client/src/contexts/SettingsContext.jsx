import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { cookieUtils } from '../utils/cookies';
import i18n from '../locales/i18n';

const SettingsContext = createContext(null);

const LANGUAGE_COOKIE = 'pureskin_language';
const THEME_COOKIE = 'pureskin_theme';

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = cookieUtils.get(LANGUAGE_COOKIE);
      return saved || 'en';
    } catch {
      return 'en';
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      const saved = cookieUtils.get(THEME_COOKIE);
      return saved || 'light';
    } catch {
      return 'light';
    }
  });

  // Initialize i18n and theme on mount
  useEffect(() => {
    try {
      const savedLang = cookieUtils.get(LANGUAGE_COOKIE) || 'en';
      const savedTheme = cookieUtils.get(THEME_COOKIE) || 'light';
      
      // Apply initial language
      if (i18n.language !== savedLang) {
        i18n.changeLanguage(savedLang);
      }
      
      // Apply initial RTL/LTR
      const html = document.documentElement;
      if (savedLang === 'ar') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
      } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', 'en');
      }
      
      // Apply initial theme - ensure it's applied correctly
      if (savedTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply language changes
  useEffect(() => {
    // Skip if language hasn't changed
    if (i18n.language === language) {
      return;
    }

    let isMounted = true;

    // Change language - this will trigger re-render in all components using useTranslation
    i18n.changeLanguage(language).then(() => {
      if (!isMounted) return;
      
      cookieUtils.set(LANGUAGE_COOKIE, language);
      
      // Apply RTL/LTR
      const html = document.documentElement;
      if (language === 'ar') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
      } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', 'en');
      }
    }).catch((err) => {
      if (!isMounted) return;
      console.error('Failed to change language:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [language]);

  // Apply theme changes
  useEffect(() => {
    const html = document.documentElement;
    
    // Remove dark class first to ensure clean state
    html.classList.remove('dark');
    
    // Apply theme class
    if (theme === 'dark') {
      html.classList.add('dark');
    }
    
    // Force a reflow to ensure the change is applied
    void html.offsetHeight;
    
    // Save to cookie
    try {
      cookieUtils.set(THEME_COOKIE, theme);
    } catch (error) {
      console.error('Error saving theme to cookie:', error);
    }
  }, [theme]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      
      // Apply immediately for instant feedback
      const html = document.documentElement;
      
      // Remove dark class first to ensure clean state
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
      }
      
      // Add dark class if needed
      if (newTheme === 'dark') {
        html.classList.add('dark');
      }
      
      // Force a reflow to ensure the change is applied
      void html.offsetHeight;
      
      // Save to cookie immediately
      try {
        cookieUtils.set(THEME_COOKIE, newTheme);
      } catch (error) {
        console.error('Error saving theme to cookie:', error);
      }
      
      return newTheme;
    });
  }, []);

  const value = useMemo(() => ({
    language,
    theme,
    toggleLanguage,
    toggleTheme,
    isRTL: language === 'ar',
  }), [language, theme, toggleLanguage, toggleTheme]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

