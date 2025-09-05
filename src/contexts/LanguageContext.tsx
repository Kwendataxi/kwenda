// BACKUP MINIMAL VERSION - WORKING VERSION TO UNBLOCK THE APP

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'kg' | 'lua' | 'sw';

// MINIMAL WORKING TRANSLATIONS - NO DUPLICATES
const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.services': 'Services',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'nav.signup': 'Inscription',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.continue': 'Continuer',
    
    // Role Selection
    'role.client': 'Client',
    'role.driver': 'Chauffeur',
    'role.partner': 'Partenaire', 
    'role.admin': 'Administrateur',
    
    // Basic support
    'support.title': 'Support Client',
    'support.subtitle': 'Nous sommes là pour vous aider',
    
    // Basic escrow
    'escrow.title': 'Coffre-fort Sécurisé',
    'escrow.no_transactions': 'Aucune transaction sécurisée',
    
    // System
    'system.loading': 'Chargement...',
    'system.error': 'Erreur',
    'system.success': 'Succès'
  },
  
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.continue': 'Continue',
    
    // Role Selection
    'role.client': 'Client',
    'role.driver': 'Driver',
    'role.partner': 'Partner',
    'role.admin': 'Administrator',
    
    // Basic support
    'support.title': 'Customer Support',
    'support.subtitle': 'We are here to help you',
    
    // Basic escrow
    'escrow.title': 'Secure Vault',
    'escrow.no_transactions': 'No secure transactions',
    
    // System
    'system.loading': 'Loading...',
    'system.error': 'Error',
    'system.success': 'Success'
  },
  
  kg: {
    // Navigation - Kikongo
    'nav.home': 'Nzo',
    'nav.services': 'Kisalu',
    'nav.about': 'Mukuatuetu',
    'nav.contact': 'Tubakana',
    'nav.login': 'Kukota',
    'nav.signup': 'Kusumina',
    
    // Common
    'common.loading': 'Yina ku kanga...',
    'common.error': 'Nkama',
    'common.success': 'Malonga',
    'common.cancel': 'Leka',
    'common.confirm': 'Kundima',
    
    // Basic
    'support.title': 'Sadila ya ba clients',
    'escrow.title': 'Coffre ya mbanza',
    'escrow.no_transactions': 'Transaction ya mbanza yafulu ko',
    'system.loading': 'Yina ku kanga...',
    'system.error': 'Nkama',
    'system.success': 'Malonga'
  },
  
  lua: {
    // Navigation - Tshiluba  
    'nav.home': 'Muetu',
    'nav.services': 'Bisalu',
    'nav.about': 'Mukuatuetu',
    'nav.contact': 'Kutusungila',
    'nav.login': 'Kukota',
    'nav.signup': 'Kusumina',
    
    // Common
    'common.loading': 'Kuntala...',
    'common.error': 'Nshimu',
    'common.success': 'Malonga',
    'common.cancel': 'Leka',
    'common.confirm': 'Kutambula',
    
    // Basic
    'support.title': 'Kusadila ba clients',
    'escrow.title': 'Coffre ya mbanza',
    'escrow.no_transactions': 'Transacton ya mbanza ibi',
    'system.loading': 'Kuntala...',
    'system.error': 'Nshimu',
    'system.success': 'Malonga'
  },
  
  sw: {
    // Navigation - Kiswahili
    'nav.home': 'Nyumbani',
    'nav.services': 'Huduma',
    'nav.about': 'Kuhusu',
    'nav.contact': 'Wasiliana',
    'nav.login': 'Ingia',
    'nav.signup': 'Jisajili',
    
    // Common
    'common.loading': 'Inapakia...',
    'common.error': 'Hitilafu',
    'common.success': 'Mafanikio',
    'common.cancel': 'Ghairi',
    'common.confirm': 'Thibitisha',
    
    // Basic
    'support.title': 'Huduma za Wateja',
    'escrow.title': 'Akiba Salama',
    'escrow.no_transactions': 'Hakuna miamala salama',
    'system.loading': 'Inapakia...',
    'system.error': 'Hitilafu',
    'system.success': 'Mafanikio'
  }
};

interface LanguageContextType {
  currentLanguage: Language;
  language: Language; // Alias for compatibility
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
  formatCurrency: (amount: number, currency?: string) => string; // Added for compatibility
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('fr');

  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[currentLanguage]?.[key] || translations.fr[key] || key;
    
    if (params) {
      return translation.replace(/\{(\d+)\}/g, (match, index) => {
        return params[index] || match;
      });
    }
    
    return translation;
  };

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('kwenda-language', language);
  };

  const formatCurrency = (amount: number, currency = 'CDF'): string => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const availableLanguages = [
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'kg' as Language, name: 'Kikongo', flag: '🇨🇩' },
    { code: 'lua' as Language, name: 'Tshiluba', flag: '🇨🇩' },
    { code: 'sw' as Language, name: 'Kiswahili', flag: '🇹🇿' }
  ];

  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('kwenda-language') as Language;
    if (savedLanguage && ['fr', 'en', 'kg', 'lua', 'sw'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      language: currentLanguage, // Alias for compatibility
      setLanguage,
      t,
      formatCurrency,
      availableLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};