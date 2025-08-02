import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'ln';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.transport': 'Transport',
    'nav.delivery': 'Livraison',
    'nav.marketplace': 'Marketplace',
    'nav.profile': 'Profil',
    'nav.history': 'Historique',
    'nav.payment': 'Paiement',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Paramètres',
    
    // Transport
    'transport.book': 'Réserver',
    'transport.pickup': 'Point de départ',
    'transport.destination': 'Destination',
    'transport.vehicle': 'Véhicule',
    'transport.price': 'Prix',
    'transport.time': 'Temps estimé',
    
    // Payment
    'payment.mobile_money': 'Mobile Money',
    'payment.airtel': 'Airtel Money',
    'payment.mpesa': 'M-Pesa',
    'payment.orange': 'Orange Money',
    'payment.amount': 'Montant',
    'payment.phone': 'Numéro de téléphone',
    'payment.confirm': 'Confirmer le paiement',
    
    // Referral
    'referral.title': 'Système de Parrainage',
    'referral.code': 'Code de parrainage',
    'referral.invite': 'Inviter des amis',
    'referral.rewards': 'Récompenses',
    'referral.total_earned': 'Total gagné',
    
    // Notifications
    'notification.new_ride': 'Nouvelle course disponible',
    'notification.payment_received': 'Paiement reçu',
    'notification.ride_completed': 'Course terminée',
    
    // Offline
    'offline.mode': 'Mode hors ligne',
    'offline.sync': 'Synchronisation en cours...',
    'offline.cached': 'Données en cache',
    
    // Security
    'security.verify': 'Vérifier l\'identité',
    'security.phone_verify': 'Vérification téléphone',
    'security.id_upload': 'Télécharger pièce d\'identité',
    
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.continue': 'Continuer',
    'common.back': 'Retour',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
  },
  ln: {
    // Navigation
    'nav.home': 'Bandako',
    'nav.transport': 'Transport',
    'nav.delivery': 'Livraison',
    'nav.marketplace': 'Zando',
    'nav.profile': 'Profil',
    'nav.history': 'Makambo ya kala',
    'nav.payment': 'Kofuta',
    'nav.notifications': 'Ba notifications',
    'nav.settings': 'Ba paramètres',
    
    // Transport
    'transport.book': 'Kokanisa',
    'transport.pickup': 'Esika ya kokende',
    'transport.destination': 'Esika ya kokoma',
    'transport.vehicle': 'Motuka',
    'transport.price': 'Ntalo',
    'transport.time': 'Ntango ya kokende',
    
    // Payment
    'payment.mobile_money': 'Mbongo ya téléphone',
    'payment.airtel': 'Airtel Money',
    'payment.mpesa': 'M-Pesa',
    'payment.orange': 'Orange Money',
    'payment.amount': 'Mbongo',
    'payment.phone': 'Numéro ya téléphone',
    'payment.confirm': 'Kondima kofuta',
    
    // Referral
    'referral.title': 'Système ya kopesa baninga',
    'referral.code': 'Code ya kopesa',
    'referral.invite': 'Kobenga baninga',
    'referral.rewards': 'Lifuti',
    'referral.total_earned': 'Mbongo nyonso ozongi',
    
    // Notifications
    'notification.new_ride': 'Mobembo ya sika ezali',
    'notification.payment_received': 'Mbongo ekomi',
    'notification.ride_completed': 'Mobembo esili',
    
    // Offline
    'offline.mode': 'Mode hors ligne',
    'offline.sync': 'Kosala synchronisation...',
    'offline.cached': 'Ba données oyo ezali na cache',
    
    // Security
    'security.verify': 'Koluka soki ozali ye',
    'security.phone_verify': 'Koluka téléphone',
    'security.id_upload': 'Kotinda karte ya identité',
    
    // Common
    'common.save': 'Kobomba',
    'common.cancel': 'Kotika',
    'common.continue': 'Kokoba',
    'common.back': 'Kozonga',
    'common.loading': 'Eza kochargé...',
    'common.error': 'Libunga',
    'common.success': 'Elongi',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('kwenda-language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('kwenda-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};