// BACKUP MINIMAL VERSION - WORKING VERSION TO UNBLOCK THE APP

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'kg' | 'lua' | 'sw';

// TRADUCTIONS COMPLÈTES - SYSTÈME MULTILINGUE COMPLET
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
    'common.save': 'Enregistrer',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.view_all': 'Voir tout',
    'common.add': 'Ajouter',
    'common.remove': 'Retirer',
    'common.close': 'Fermer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.continue': 'Continuer',
    'auth.logout': 'Déconnexion',
    'auth.forgot_password': 'Mot de passe oublié',
    'auth.reset_password': 'Réinitialiser le mot de passe',
    'auth.confirm_password': 'Confirmer le mot de passe',
    'auth.create_account': 'Créer un compte',
    
    // Role Selection
    'role.client': 'Client',
    'role.driver': 'Chauffeur',
    'role.partner': 'Partenaire', 
    'role.admin': 'Administrateur',
    'role.select': 'Choisir un rôle',
    'role.client_desc': 'Commandez des courses et livraisons',
    'role.driver_desc': 'Devenez chauffeur partenaire',
    'role.partner_desc': 'Gérez votre flotte de véhicules',
    
    // Home/Recent Places
    'home.recent_places': 'Lieux récents',
    'home.no_recent_places': 'Aucun lieu récent trouvé',
    'home.recent_places_help': 'Vos dernières destinations apparaîtront ici',
    'home.add_current_location': 'Ajouter ma position',
    'home.use_current_location': 'Utiliser ma position actuelle',
    'home.set_as_home': 'Définir comme domicile',
    'home.set_as_work': 'Définir comme bureau',
    'home.home_label': 'Domicile',
    'home.work_label': 'Bureau',
    'home.remove_place': 'Supprimer ce lieu',
    'home.search.placeholder': 'Où voulez-vous aller ?',
    'home.services.taxi': 'Transport',
    'home.services.delivery': 'Livraison',
    'home.services.shopping': 'Shopping',
    'home.services.rental': 'Location',
    'home.services.lottery': 'Tombola',
    
    // Toast messages
    'toast.place_removed': 'Lieu supprimé',
    'toast.place_removed_desc': 'Le lieu a été retiré de vos lieux récents',
    'toast.location_added': 'Position ajoutée',
    'toast.location_added_desc': 'Votre position actuelle a été ajoutée aux lieux récents',
    'toast.location_error': 'Erreur',
    'toast.location_error_desc': 'Impossible d\'obtenir votre position actuelle',
    'toast.home_set': 'Domicile défini',
    'toast.home_set_desc': '{0} est maintenant votre domicile',
    'toast.work_set': 'Bureau défini',
    'toast.work_set_desc': '{0} est maintenant votre bureau',
    
    // Hero Section
    'hero.title': 'Transport et Livraison en RDC',
    'hero.subtitle': 'Votre solution complète de mobilité urbaine',
    'hero.description': 'Des courses VTC aux livraisons express, découvrez Kwenda - l\'application qui révolutionne le transport en République Démocratique du Congo.',
    'hero.cta_start': 'Commencer maintenant',
    'hero.cta_demo': 'Voir la démo',
    'hero.stats.cities': 'Villes actives',
    'hero.stats.available': 'Disponible 24h/7j',
    'hero.stats.payment': 'Paiement sécurisé',
    'hero.stats.support': 'Support client',
    'hero.kwenda_taxi': 'Kwenda Taxi',
    'hero.made_in_rdc': 'Fait en RDC',
    'hero.innovation_excellence': 'Innovation & Excellence',
    'hero.tagline': 'Votre partenaire mobilité en Afrique',
    'hero.start_now': 'Commencer maintenant',
    'hero.view_demo': 'Voir la démo',
    'hero.transport_types': 'Types de transport',
    'hero.customer_service': 'Service client',
    'hero.available_24_7': 'Disponible 24h/7j',
    'hero.kwenda_pay': 'KwendaPay',
    'hero.location': 'Kinshasa, Lubumbashi, Kolwezi',
    'hero.alt_text': 'Service de transport Kwenda Taxi en RDC',
    
    // Services
    'services.title': 'Nos Services',
    'services.subtitle': 'Solutions complètes pour tous vos besoins de mobilité',
    'services.vtc.title': 'VTC & Transport',
    'services.vtc.description': 'Courses privées et partagées',
    'services.delivery.title': 'Livraison Express',
    'services.delivery.description': 'Livraisons rapides et sécurisées',
    'services.marketplace.title': 'Marketplace',
    'services.marketplace.description': 'Boutique en ligne intégrée',
    'services.rental.title': 'Location de véhicules',
    'services.rental.description': 'Louez des véhicules facilement',
    
    // Features
    'features.title': 'Fonctionnalités Avancées',
    'features.subtitle': 'Une expérience utilisateur exceptionnelle',
    'features.realtime.title': 'Suivi en temps réel',
    'features.realtime.description': 'Suivez vos courses et livraisons en direct',
    'features.payment.title': 'Paiements sécurisés',
    'features.payment.description': 'Multiple options de paiement local',
    'features.multilingual.title': 'Multilingue',
    'features.multilingual.description': 'Interface en français et langues locales',
    'features.support.title': 'Support 24/7',
    'features.support.description': 'Assistance client disponible en permanence',
    'features.stats_cities': '4+ Villes',
    'features.maximum_security': 'Sécurité maximale',
    'features.stats_support': 'Support 24/7',
    
    // Support
    'support.title': 'Support Client',
    'support.subtitle': 'Nous sommes là pour vous aider',
    'support.contact': 'Nous contacter',
    'support.faq': 'FAQ',
    'support.help': 'Centre d\'aide',
    'support.contact_us': 'Nous contacter',
    'support.phone': 'Téléphone',
    'support.phone_desc': 'Appelez-nous directement',
    'support.contact_phone': '+243 970 123 456',
    'support.availability_phone': 'Disponible 24h/7j',
    'support.email': 'Email',
    'support.email_desc': 'Envoyez-nous un message',
    'support.contact_email': 'support@kwenda.cd',
    'support.availability_email': 'Réponse sous 2h',
    'support.chat': 'Chat en direct',
    'support.chat_desc': 'Discutez avec un agent',
    'support.contact_chat': 'Démarrer une conversation',
    'support.availability_chat': 'En ligne maintenant',
    'support.create_ticket': 'Créer un ticket',
    'support.category_required': 'Catégorie requise',
    'support.select_category': 'Sélectionner une catégorie',
    'support.priority': 'Priorité',
    'support.priority_low': 'Faible',
    'support.priority_medium': 'Moyenne',
    'support.priority_high': 'Élevée',
    'support.priority_urgent': 'Urgente',
    'support.subject': 'Sujet',
    'support.subject_required': 'Sujet requis',
    'support.subject_placeholder': 'Décrivez brièvement votre problème',
    'support.description': 'Description',
    'support.description_required': 'Description requise',
    'support.description_placeholder': 'Décrivez votre problème en détail...',
    'support.send_ticket': 'Envoyer le ticket',
    'support.ticket_sent': 'Ticket envoyé',
    'support.ticket_sent_desc': 'Votre demande a été transmise avec succès',
    'support.available_soon': 'Bientôt disponible',
    'support.status_open': 'Ouvert',
    'support.status_in_progress': 'En cours',
    'support.status_resolved': 'Résolu',
    'support.status_closed': 'Fermé',
    'support.categories.general': 'Général',
    'support.categories.technical': 'Technique',
    'support.categories.billing': 'Facturation',
    'support.categories.account': 'Compte',
    
    // Escrow
    'escrow.title': 'Coffre-fort Sécurisé',
    'escrow.no_transactions': 'Aucune transaction sécurisée',
    'escrow.description': 'Vos paiements sont protégés',
    
    // System
    'system.loading': 'Chargement...',
    'system.error': 'Erreur',
    'system.success': 'Succès',
    'system.error_occurred': 'Une erreur s\'est produite',
    'system.try_again': 'Réessayer',
    'system.no_data': 'Aucune donnée disponible',
    
    // Payment
    'payment.method': 'Paiement mobile',
    'payment.secure': 'Paiement sécurisé',
    'payment.options': 'Options de paiement',
    
    // Marketplace
    'marketplace.new_badge': 'Nouveau',
    'marketplace.featured': 'À la une',
    'marketplace.trending': 'Tendance',
    
    // Lottery
    'lottery.free_lottery': 'Loterie gratuite',
    'lottery.win_credits': 'Gagnez des crédits',
    'lottery.daily_draw': 'Tirage quotidien'
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
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view_all': 'View All',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.continue': 'Continue',
    'auth.logout': 'Logout',
    'auth.forgot_password': 'Forgot Password',
    'auth.reset_password': 'Reset Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.create_account': 'Create Account',
    
    // Role Selection
    'role.client': 'Client',
    'role.driver': 'Driver',
    'role.partner': 'Partner',
    'role.admin': 'Administrator',
    'role.select': 'Select Role',
    'role.client_desc': 'Order rides and deliveries',
    'role.driver_desc': 'Become a partner driver',
    'role.partner_desc': 'Manage your vehicle fleet',
    
    // Home/Recent Places
    'home.recent_places': 'Recent Places',
    'home.no_recent_places': 'No recent places found',
    'home.recent_places_help': 'Your recent destinations will appear here',
    'home.add_current_location': 'Add My Location',
    'home.use_current_location': 'Use my current location',
    'home.set_as_home': 'Set as Home',
    'home.set_as_work': 'Set as Work',
    'home.home_label': 'Home',
    'home.work_label': 'Work',
    'home.remove_place': 'Remove this place',
    'home.search.placeholder': 'Where do you want to go?',
    'home.services.taxi': 'Transport',
    'home.services.delivery': 'Delivery',
    'home.services.shopping': 'Shopping',
    'home.services.rental': 'Rental',
    'home.services.lottery': 'Lottery',
    
    // Toast messages
    'toast.place_removed': 'Place Removed',
    'toast.place_removed_desc': 'The place has been removed from your recent places',
    'toast.location_added': 'Location Added',
    'toast.location_added_desc': 'Your current location has been added to recent places',
    'toast.location_error': 'Error',
    'toast.location_error_desc': 'Unable to get your current location',
    'toast.home_set': 'Home Set',
    'toast.home_set_desc': '{0} is now your home',
    'toast.work_set': 'Work Set',
    'toast.work_set_desc': '{0} is now your work',
    
    // Hero Section
    'hero.title': 'Transport and Delivery in DRC',
    'hero.subtitle': 'Your complete urban mobility solution',
    'hero.description': 'From VTC rides to express deliveries, discover Kwenda - the app revolutionizing transport in the Democratic Republic of Congo.',
    'hero.cta_start': 'Get Started',
    'hero.cta_demo': 'View Demo',
    'hero.stats.cities': 'Active Cities',
    'hero.stats.available': 'Available 24/7',
    'hero.stats.payment': 'Secure Payment',
    'hero.stats.support': 'Customer Support',
    'hero.kwenda_taxi': 'Kwenda Taxi',
    'hero.made_in_rdc': 'Made in DRC',
    'hero.innovation_excellence': 'Innovation & Excellence',
    'hero.tagline': 'Your mobility partner in Africa',
    'hero.start_now': 'Get Started',
    'hero.view_demo': 'View Demo',
    'hero.transport_types': 'Transport Types',
    'hero.customer_service': 'Customer Service',
    'hero.available_24_7': 'Available 24/7',
    'hero.kwenda_pay': 'KwendaPay',
    'hero.location': 'Kinshasa, Lubumbashi, Kolwezi',
    'hero.alt_text': 'Kwenda Taxi transport service in DRC',
    
    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Complete solutions for all your mobility needs',
    'services.vtc.title': 'VTC & Transport',
    'services.vtc.description': 'Private and shared rides',
    'services.delivery.title': 'Express Delivery',
    'services.delivery.description': 'Fast and secure deliveries',
    'services.marketplace.title': 'Marketplace',
    'services.marketplace.description': 'Integrated online store',
    'services.rental.title': 'Vehicle Rental',
    'services.rental.description': 'Rent vehicles easily',
    
    // Features
    'features.title': 'Advanced Features',
    'features.subtitle': 'An exceptional user experience',
    'features.realtime.title': 'Real-time Tracking',
    'features.realtime.description': 'Track your rides and deliveries live',
    'features.payment.title': 'Secure Payments',
    'features.payment.description': 'Multiple local payment options',
    'features.multilingual.title': 'Multilingual',
    'features.multilingual.description': 'Interface in French and local languages',
    'features.support.title': '24/7 Support',
    'features.support.description': 'Customer assistance available around the clock',
    'features.stats_cities': '4+ Cities',
    'features.maximum_security': 'Maximum Security',
    'features.stats_support': '24/7 Support',
    
    // Support
    'support.title': 'Customer Support',
    'support.subtitle': 'We are here to help you',
    'support.contact': 'Contact Us',
    'support.faq': 'FAQ',
    'support.help': 'Help Center',
    'support.contact_us': 'Contact Us',
    'support.phone': 'Phone',
    'support.phone_desc': 'Call us directly',
    'support.contact_phone': '+243 970 123 456',
    'support.availability_phone': 'Available 24/7',
    'support.email': 'Email',
    'support.email_desc': 'Send us a message',
    'support.contact_email': 'support@kwenda.cd',
    'support.availability_email': 'Response within 2h',
    'support.chat': 'Live Chat',
    'support.chat_desc': 'Chat with an agent',
    'support.contact_chat': 'Start a conversation',
    'support.availability_chat': 'Online now',
    'support.create_ticket': 'Create Ticket',
    'support.category_required': 'Category required',
    'support.select_category': 'Select a category',
    'support.priority': 'Priority',
    'support.priority_low': 'Low',
    'support.priority_medium': 'Medium',
    'support.priority_high': 'High',
    'support.priority_urgent': 'Urgent',
    'support.subject': 'Subject',
    'support.subject_required': 'Subject required',
    'support.subject_placeholder': 'Briefly describe your issue',
    'support.description': 'Description',
    'support.description_required': 'Description required',
    'support.description_placeholder': 'Describe your issue in detail...',
    'support.send_ticket': 'Send Ticket',
    'support.ticket_sent': 'Ticket Sent',
    'support.ticket_sent_desc': 'Your request has been submitted successfully',
    'support.available_soon': 'Available Soon',
    'support.status_open': 'Open',
    'support.status_in_progress': 'In Progress',
    'support.status_resolved': 'Resolved',
    'support.status_closed': 'Closed',
    'support.categories.general': 'General',
    'support.categories.technical': 'Technical',
    'support.categories.billing': 'Billing',
    'support.categories.account': 'Account',
    
    // Escrow
    'escrow.title': 'Secure Vault',
    'escrow.no_transactions': 'No secure transactions',
    'escrow.description': 'Your payments are protected',
    
    // System
    'system.loading': 'Loading...',
    'system.error': 'Error',
    'system.success': 'Success',
    'system.error_occurred': 'An error occurred',
    'system.try_again': 'Try Again',
    'system.no_data': 'No data available',
    
    // Payment
    'payment.method': 'Mobile Payment',
    'payment.secure': 'Secure Payment',
    'payment.options': 'Payment Options',
    
    // Marketplace
    'marketplace.new_badge': 'New',
    'marketplace.featured': 'Featured',
    'marketplace.trending': 'Trending',
    
    // Lottery
    'lottery.free_lottery': 'Free Lottery',
    'lottery.win_credits': 'Win Credits',
    'lottery.daily_draw': 'Daily Draw'
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
    'support.contact_us': 'Tubakana',
    'support.phone': 'Telefone',
    'support.email': 'Email',
    'support.chat': 'Mongo mongo',
    'support.create_ticket': 'Sala ticket',
    'support.subject': 'Makambu',
    'support.description': 'Malongi',
    'support.send_ticket': 'Tuma ticket',
    'support.available_soon': 'Kenda ye mingi ko',
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
    'support.contact_us': 'Kutusungila',
    'support.phone': 'Telefone',
    'support.email': 'Email',
    'support.chat': 'Kusambula',
    'support.create_ticket': 'Kusala ticket',
    'support.subject': 'Mukanda',
    'support.description': 'Malongi',
    'support.send_ticket': 'Kutuma ticket',
    'support.available_soon': 'Kabidi mingi ko',
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
    'support.contact_us': 'Wasiliana Nasi',
    'support.phone': 'Simu',
    'support.email': 'Barua pepe',
    'support.chat': 'Mazungumzo',
    'support.create_ticket': 'Unda tiketi',
    'support.subject': 'Mada',
    'support.description': 'Maelezo',
    'support.send_ticket': 'Tuma tiketi',
    'support.available_soon': 'Itapatikana hivi karibuni',
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