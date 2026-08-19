import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import en from '../translations/en';
import ta from '../translations/ta';

const LanguageContext = createContext(null);

const translations = { en, ta };

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('carpe_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('carpe_font_size');
      return saved !== null ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });

  const setLanguage = useCallback((lang) => {
    const validLang = lang === 'ta' ? 'ta' : 'en';
    setLanguageState(validLang);
    try {
      localStorage.setItem('carpe_language', validLang);
    } catch (e) {
      console.error('Failed to save language to localStorage', e);
    }
  }, []);

  const updateFontSizeLevel = useCallback((level) => {
    setFontSizeLevel(level);
    try {
      localStorage.setItem('carpe_font_size', String(level));
    } catch (e) {
      console.error('Failed to save font size to localStorage', e);
    }
  }, []);

  // Nested translation helper: t('section.key', { param: 'value' })
  const t = useCallback(
    (path, params = {}) => {
      const dict = translations[language] || translations.en;
      const keys = path.split('.');
      let current = dict;

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          // Fallback to English dictionary
          let fallback = translations.en;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              fallback = null;
              break;
            }
          }
          current = fallback !== null ? fallback : path;
          break;
        }
      }

      if (typeof current !== 'string') {
        return path;
      }

      // Replace placeholders like {count}
      let result = current;
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      });

      return result;
    },
    [language]
  );

  // Helper to translate waste categories for UI display
  const translateWasteType = useCallback(
    (wasteType) => {
      if (!wasteType) return '';
      const dict = translations[language] || translations.en;
      return dict.wasteTypes?.[wasteType] || wasteType;
    },
    [language]
  );

  // Helper to translate priority
  const translatePriority = useCallback(
    (priority) => {
      if (!priority) return '';
      const upper = String(priority).toUpperCase();
      const dict = translations[language] || translations.en;
      if (upper === 'HIGH') return dict.common.highPriority;
      if (upper === 'MEDIUM') return dict.common.mediumPriority;
      if (upper === 'LOW') return dict.common.lowPriority;
      return priority;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      translateWasteType,
      translatePriority,
      fontSizeLevel,
      setFontSizeLevel: updateFontSizeLevel
    }),
    [language, setLanguage, t, translateWasteType, translatePriority, fontSizeLevel, updateFontSizeLevel]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
