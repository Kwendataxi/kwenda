import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'ln' | 'kg' | 'lua' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number, currency?: 'CDF' | 'USD') => string;
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
    
    // Transport Congo RDC
    'transport.book': 'Réserver',
    'transport.pickup': 'Point de départ',
    'transport.destination': 'Destination',
    'transport.vehicle': 'Véhicule',
    'transport.price': 'Prix',
    'transport.time': 'Temps estimé',
    'transport.taxi_bus': 'Taxi-bus',
    'transport.moto_taxi': 'Moto-taxi',
    'transport.taxi_voiture': 'Taxi voiture',
    'transport.bus_transco': 'Bus Transco',
    
    // Quartiers Kinshasa
    'location.gombe': 'Gombe',
    'location.kinshasa': 'Kinshasa',
    'location.lemba': 'Lemba',
    'location.ngaliema': 'Ngaliema',
    'location.matete': 'Matete',
    'location.masina': 'Masina',
    'location.ndjili': 'N\'djili',
    'location.kimbanseke': 'Kimbanseke',
    
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
    
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.continue': 'Continuer',
    'common.back': 'Retour',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.confirm': 'Confirmer',
    'common.offline': 'Hors ligne',
    'common.retry': 'Réessayer',
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
    
    // Transport Congo RDC
    'transport.book': 'Kokanisa',
    'transport.pickup': 'Esika ya kokende',
    'transport.destination': 'Esika ya kokoma',
    'transport.vehicle': 'Motuka',
    'transport.price': 'Ntalo',
    'transport.time': 'Ntango ya kokende',
    'transport.taxi_bus': 'Taxi-bus',
    'transport.moto_taxi': 'Moto-taxi',
    'transport.taxi_voiture': 'Taxi motuka',
    'transport.bus_transco': 'Bus Transco',
    
    // Quartiers Kinshasa
    'location.gombe': 'Gombe',
    'location.kinshasa': 'Kinshasa',
    'location.lemba': 'Lemba',
    'location.ngaliema': 'Ngaliema',
    'location.matete': 'Matete',
    'location.masina': 'Masina',
    'location.ndjili': 'N\'djili',
    'location.kimbanseke': 'Kimbanseke',
    
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
    
    // Common
    'common.save': 'Kobomba',
    'common.cancel': 'Kotika',
    'common.continue': 'Kokoba',
    'common.back': 'Kozonga',
    'common.loading': 'Eza kochargé...',
    'common.error': 'Libunga',
    'common.success': 'Elongi',
    'common.confirm': 'Kondima',
    'common.offline': 'Hors ligne',
    'common.retry': 'Komeka lisusu',
  },
  kg: { // Kikongo
    // Navigation
    'nav.home': 'Nzo',
    'nav.transport': 'Transport',
    'nav.delivery': 'Livraison',
    'nav.marketplace': 'Zando',
    'nav.profile': 'Profil',
    'nav.history': 'Makambu ma kala',
    'nav.payment': 'Kufuta',
    'nav.notifications': 'Bisalu',
    'nav.settings': 'Paramètres',
    
    // Transport Congo RDC
    'transport.book': 'Kukanisa',
    'transport.pickup': 'Fulu ya kutuka',
    'transport.destination': 'Fulu ya kukenda',
    'transport.vehicle': 'Motuka',
    'transport.price': 'Ntalu',
    'transport.time': 'Thangu ya kukenda',
    'transport.taxi_bus': 'Taxi-bus',
    'transport.moto_taxi': 'Moto-taxi',
    'transport.taxi_voiture': 'Taxi motuka',
    'transport.bus_transco': 'Bus Transco',
    
    // Common
    'common.save': 'Kubika',
    'common.cancel': 'Kutika',
    'common.continue': 'Kukoba',
    'common.back': 'Kuvutuka',
    'common.loading': 'Yina ku charge...',
    'common.error': 'Nkama',
    'common.success': 'Malonga',
    'common.confirm': 'Kundima',
    'common.offline': 'Hors ligne',
    'common.retry': 'Kusolula diaka',
  },
  lua: { // Tshiluba
    // Navigation
    'nav.home': 'Muetu',
    'nav.transport': 'Transport',
    'nav.delivery': 'Livraison',
    'nav.marketplace': 'Mubanda',
    'nav.profile': 'Profil',
    'nav.history': 'Bintu bia kala',
    'nav.payment': 'Kulipa',
    'nav.notifications': 'Makambu',
    'nav.settings': 'Paramètres',
    
    // Transport Congo RDC
    'transport.book': 'Kubanda',
    'transport.pickup': 'Mahali pakutanga',
    'transport.destination': 'Mahali pakufika',
    'transport.vehicle': 'Motuka',
    'transport.price': 'Bei',
    'transport.time': 'Nako ya kuya',
    
    // Common
    'common.save': 'Kubika',
    'common.cancel': 'Kuleka',
    'common.continue': 'Kuendelea',
    'common.back': 'Kubuya',
    'common.loading': 'Nkucharge...',
    'common.error': 'Nshimu',
    'common.success': 'Malonga',
    'common.confirm': 'Kukatala',
    'common.offline': 'Hors ligne',
    'common.retry': 'Kusolola',
  },
  sw: { // Swahili
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.transport': 'Usafiri',
    'nav.delivery': 'Utoaji',
    'nav.marketplace': 'Soko',
    'nav.profile': 'Profili',
    'nav.history': 'Historia',
    'nav.payment': 'Malipo',
    'nav.notifications': 'Arifa',
    'nav.settings': 'Mipangilio',
    
    // Transport Congo RDC
    'transport.book': 'Kuweka',
    'transport.pickup': 'Mahali pa kuchukua',
    'transport.destination': 'Unakoenda',
    'transport.vehicle': 'Gari',
    'transport.price': 'Bei',
    'transport.time': 'Muda wa kufikia',
    'transport.taxi_bus': 'Basi-taxi',
    'transport.moto_taxi': 'Piki-piki',
    'transport.taxi_voiture': 'Taxi gari',
    'transport.bus_transco': 'Basi Transco',
    
    // Common
    'common.save': 'Hifadhi',
    'common.cancel': 'Ghairi',
    'common.continue': 'Endelea',
    'common.back': 'Rudi',
    'common.loading': 'Inapakia...',
    'common.error': 'Kosa',
    'common.success': 'Mafanikio',
    'common.confirm': 'Thibitisha',
    'common.offline': 'Bila mtandao',
    'common.retry': 'Jaribu tena',
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
    return translations[language][key] || translations.fr[key] || key;
  };

  const formatCurrency = (amount: number, currency: 'CDF' | 'USD' = 'CDF'): string => {
    if (currency === 'CDF') {
      return new Intl.NumberFormat('fr-CD', {
        style: 'currency',
        currency: 'CDF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatCurrency }}>
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