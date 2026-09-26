// src/i18n/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export const CATEGORY_DATA = {
  PCB: {
    code: 'PCB',
    cpcbCode: 'ITEW1',
    en: 'Printed Circuit Boards (PCB)',
    hi: 'सर्किट बोर्ड / पीसीबी',
    mr: 'सर्किट बोर्ड / पीसीबी',
    color: '#10B981',
    icon: 'Memory',
  },
  Cable: {
    code: 'Cable',
    cpcbCode: 'CEEW2',
    en: 'Copper Cable & Wire',
    hi: 'तांबा तार / केबल',
    mr: 'तांब्याची वायर / केबल',
    color: '#38BDF8',
    icon: 'Cable',
  },
  Battery: {
    code: 'Battery',
    cpcbCode: 'BATT1',
    en: 'Batteries (Lead / Lithium)',
    hi: 'बैटरी (लेड व लिथियम)',
    mr: 'बॅटरी (लेड व लिथियम)',
    color: '#F59E0B',
    icon: 'BatteryChargingFull',
  },
  CRT: {
    code: 'CRT',
    cpcbCode: 'ITEW3',
    en: 'Old CRT Monitors / TVs',
    hi: 'पुराना टीवी / सीआरटी',
    mr: 'जुना टीव्ही / सीआरटी',
    color: '#A855F7',
    icon: 'Tv',
  },
  LCD: {
    code: 'LCD',
    cpcbCode: 'ITEW4',
    en: 'LCD / LED Monitors & Screens',
    hi: 'स्क्रीन / मॉनिटर (LCD/LED)',
    mr: 'स्क्रीन / मॉनिटर (LCD/LED)',
    color: '#EC4899',
    icon: 'Monitor',
  },
  Motor: {
    code: 'Motor',
    cpcbCode: 'CEEW4',
    en: 'Electric Motors & Compressors',
    hi: 'मोटर / कंप्रेसर',
    mr: 'मोटार / कॉम्प्रेसर',
    color: '#6366F1',
    icon: 'SettingsSuggest',
  },
  Plastic: {
    code: 'Plastic',
    cpcbCode: 'PLAS1',
    en: 'E-Waste Plastic Housings',
    hi: 'ई-कचरा प्लास्टिक केसिंग',
    mr: 'ई-कचरा प्लास्टिक केसिंग',
    color: '#14B8A6',
    icon: 'Recycling',
  },
  Mixed: {
    code: 'Mixed',
    cpcbCode: 'MIX01',
    en: 'Mixed Electronic Scrap',
    hi: 'मिश्रित ई-कबाड़',
    mr: 'मिश्र ई-भंगार',
    color: '#F97316',
    icon: 'Category',
  },
  Other: {
    code: 'Other',
    cpcbCode: 'GEN01',
    en: 'General Scrap Material',
    hi: 'अन्य कबाड़ सामग्री',
    mr: 'इतर साहित्य',
    color: '#94A3B8',
    icon: 'MoreHoriz',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('kc_app_lang') || 'hi';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const setLang = (newLang) => {
    if (['en', 'hi', 'mr'].includes(newLang)) {
      setLangState(newLang);
      localStorage.setItem('kc_app_lang', newLang);
      window.dispatchEvent(new CustomEvent('kc-lang-changed', { detail: { lang: newLang } }));
    }
  };

  // Nested translation lookup with fallback
  const t = useCallback((path, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');
    
    // Try selected language
    let cur = translations[lang];
    for (const p of parts) {
      if (cur && cur[p] !== undefined) {
        cur = cur[p];
      } else {
        cur = null;
        break;
      }
    }
    if (cur !== null && typeof cur === 'string') return cur;

    // Fallback to English
    cur = translations.en;
    for (const p of parts) {
      if (cur && cur[p] !== undefined) {
        cur = cur[p];
      } else {
        cur = null;
        break;
      }
    }
    if (cur !== null && typeof cur === 'string') return cur;

    return fallback || path;
  }, [lang]);

  // Voice speech synthesis helper (accessible for low-literacy users)
  const speak = useCallback((text, targetLang = null) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();
    const effectiveLang = targetLang || lang;
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick speech synthesis language code
    if (effectiveLang === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (effectiveLang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.90; // Natural, measured speed for easy comprehension
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        speak,
        stopSpeaking,
        isSpeaking,
        CATEGORY_DATA,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
