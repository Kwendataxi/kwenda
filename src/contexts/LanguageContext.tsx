import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fr' | 'en' | 'ln' | 'kg' | 'lua' | 'sw';

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
    'nav.wallet': 'Portefeuille',
    'nav.earnings': 'Gains',
    'nav.challenges': 'Défis',
    'nav.support': 'Support',
    
    // Auth
    'auth.login': 'Se connecter',
    'auth.register': 'S\'inscrire',
    'auth.logout': 'Se déconnecter',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.phone': 'Téléphone',
    'auth.forgot_password': 'Mot de passe oublié',
    'auth.reset_password': 'Réinitialiser',
    'auth.verify_phone': 'Vérifier le téléphone',
    
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
    'transport.status.pending': 'En attente',
    'transport.status.confirmed': 'Confirmé',
    'transport.status.en_route': 'En route',
    'transport.status.arrived': 'Arrivé',
    'transport.status.completed': 'Terminé',
    'transport.status.cancelled': 'Annulé',
    'transport.driver_arriving': 'Chauffeur en approche',
    'transport.eta': 'Arrivée estimée',
    
    // Delivery
    'delivery.flash': 'Livraison Flash',
    'delivery.cargo': 'Livraison Cargo',
    'delivery.package_type': 'Type de colis',
    'delivery.weight': 'Poids',
    'delivery.dimensions': 'Dimensions',
    'delivery.fragile': 'Fragile',
    'delivery.urgent': 'Urgent',
    'delivery.instructions': 'Instructions',
    'delivery.recipient_name': 'Nom du destinataire',
    'delivery.recipient_phone': 'Téléphone destinataire',
    'delivery.delivery_time': 'Heure de livraison',
    'delivery.status.pending': 'En attente',
    'delivery.status.picked_up': 'Récupéré',
    'delivery.status.in_transit': 'En transit',
    'delivery.status.delivered': 'Livré',
    'delivery.status.cancelled': 'Annulé',
    
    // Marketplace
    'marketplace.products': 'Produits',
    'marketplace.categories': 'Catégories',
    'marketplace.cart': 'Panier',
    'marketplace.favorites': 'Favoris',
    'marketplace.orders': 'Commandes',
    'marketplace.sell': 'Vendre',
    'marketplace.buy': 'Acheter',
    'marketplace.add_to_cart': 'Ajouter au panier',
    'marketplace.checkout': 'Commander',
    'marketplace.price': 'Prix',
    'marketplace.description': 'Description',
    'marketplace.seller': 'Vendeur',
    'marketplace.rating': 'Note',
    'marketplace.reviews': 'Avis',
    'marketplace.stock': 'Stock',
    'marketplace.category': 'Catégorie',
    
    // Driver
    'driver.dashboard': 'Tableau de bord',
    'driver.earnings': 'Gains',
    'driver.trips': 'Courses',
    'driver.status': 'Statut',
    'driver.online': 'En ligne',
    'driver.offline': 'Hors ligne',
    'driver.available': 'Disponible',
    'driver.busy': 'Occupé',
    'driver.accept_trip': 'Accepter la course',
    'driver.decline_trip': 'Refuser la course',
    'driver.start_trip': 'Commencer la course',
    'driver.complete_trip': 'Terminer la course',
    'driver.vehicle_info': 'Infos véhicule',
    'driver.license': 'Permis',
    'driver.rating': 'Note',
    'driver.total_trips': 'Total courses',
    
    // Wallet
    'wallet.balance': 'Solde',
    'wallet.topup': 'Recharger',
    'wallet.withdraw': 'Retirer',
    'wallet.history': 'Historique',
    'wallet.transaction': 'Transaction',
    'wallet.amount': 'Montant',
    'wallet.fee': 'Frais',
    'wallet.total': 'Total',
    'wallet.pending': 'En attente',
    'wallet.completed': 'Terminé',
    'wallet.failed': 'Échoué',
    
    // Notifications
    'notification.new_trip': 'Nouvelle course disponible',
    'notification.trip_accepted': 'Course acceptée',
    'notification.driver_arrived': 'Chauffeur arrivé',
    'notification.trip_started': 'Course commencée',
    'notification.trip_completed': 'Course terminée',
    'notification.payment_received': 'Paiement reçu',
    'notification.promotion': 'Promotion spéciale',
    'notification.system': 'Notification système',
    
    // Villes principales
    'city.kinshasa': 'Kinshasa',
    'city.lubumbashi': 'Lubumbashi', 
    'city.kolwezi': 'Kolwezi',
    
    // Quartiers Kinshasa
    'location.gombe': 'Gombe',
    'location.kinshasa': 'Kinshasa',
    'location.lemba': 'Lemba',
    'location.ngaliema': 'Ngaliema',
    'location.matete': 'Matete',
    'location.masina': 'Masina',
    'location.ndjili': 'N\'djili',
    'location.kimbanseke': 'Kimbanseke',
    'location.kalamu': 'Kalamu',
    'location.limete': 'Limete',
    'location.kintambo': 'Kintambo',
    
    // Quartiers Lubumbashi
    'location.kenya': 'Kenya',
    'location.kampemba': 'Kampemba',
    'location.kamalondo': 'Kamalondo',
    'location.katuba': 'Katuba',
    'location.ruashi': 'Ruashi',
    'location.annexe': 'Annexe',
    
    // Quartiers Kolwezi
    'location.centre_ville': 'Centre-ville',
    'location.mutanda': 'Mutanda',
    'location.dilala': 'Dilala',
    'location.manika': 'Manika',
    
    // Payment
    'payment.mobile_money': 'Mobile Money',
    'payment.airtel': 'Airtel Money',
    'payment.mpesa': 'M-Pesa',
    'payment.orange': 'Orange Money',
    'payment.amount': 'Montant',
    'payment.phone': 'Numéro de téléphone',
    'payment.confirm': 'Confirmer le paiement',
    'payment.method': 'Méthode de paiement',
    'payment.cash': 'Espèces',
    'payment.wallet': 'Portefeuille',
    'payment.card': 'Carte',
    'payment.status.pending': 'En attente',
    'payment.status.success': 'Réussi',
    'payment.status.failed': 'Échoué',
    
    // Referral
    'referral.title': 'Système de Parrainage',
    'referral.code': 'Code de parrainage',
    'referral.invite': 'Inviter des amis',
    'referral.rewards': 'Récompenses',
    'referral.total_earned': 'Total gagné',
    'referral.share': 'Partager',
    'referral.copy_code': 'Copier le code',
    
    // Profile
    'profile.edit': 'Modifier le profil',
    'profile.name': 'Nom',
    'profile.email': 'Email',
    'profile.phone': 'Téléphone',
    'profile.address': 'Adresse',
    'profile.photo': 'Photo',
    'profile.verification': 'Vérification',
    'profile.documents': 'Documents',
    'profile.preferences': 'Préférences',
    'profile.language': 'Langue',
    'profile.notifications': 'Notifications',
    'profile.privacy': 'Confidentialité',
    
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
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.date': 'Date',
    'common.time': 'Heure',
    'common.status': 'Statut',
    'common.actions': 'Actions',
    'common.details': 'Détails',
    'common.close': 'Fermer',
    'common.select': 'Sélectionner',
    'common.upload': 'Télécharger',
    'common.download': 'Télécharger',
    'common.share': 'Partager',
    'common.copy': 'Copier',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.add': 'Ajouter',
    'common.remove': 'Retirer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.ok': 'OK',
    'common.done': 'Terminé',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.skip': 'Ignorer',
    'common.help': 'Aide',
    'common.about': 'À propos',
    'common.contact': 'Contact',
    'common.terms': 'Conditions',
    'common.privacy': 'Confidentialité',
    'common.user': 'Utilisateur',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.transport': 'Transport',
    'nav.delivery': 'Delivery',
    'nav.marketplace': 'Marketplace',
    'nav.profile': 'Profile',
    'nav.history': 'History',
    'nav.payment': 'Payment',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.wallet': 'Wallet',
    'nav.earnings': 'Earnings',
    'nav.challenges': 'Challenges',
    'nav.support': 'Support',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.phone': 'Phone',
    'auth.forgot_password': 'Forgot Password',
    'auth.reset_password': 'Reset',
    'auth.verify_phone': 'Verify Phone',
    
    // Transport Congo RDC
    'transport.book': 'Book',
    'transport.pickup': 'Pickup Point',
    'transport.destination': 'Destination',
    'transport.vehicle': 'Vehicle',
    'transport.price': 'Price',
    'transport.time': 'Estimated Time',
    'transport.taxi_bus': 'Taxi-bus',
    'transport.moto_taxi': 'Moto-taxi',
    'transport.taxi_voiture': 'Car Taxi',
    'transport.bus_transco': 'Transco Bus',
    'transport.status.pending': 'Pending',
    'transport.status.confirmed': 'Confirmed',
    'transport.status.en_route': 'En Route',
    'transport.status.arrived': 'Arrived',
    'transport.status.completed': 'Completed',
    'transport.status.cancelled': 'Cancelled',
    'transport.driver_arriving': 'Driver Approaching',
    'transport.eta': 'Estimated Arrival',
    
    // Delivery
    'delivery.flash': 'Flash Delivery',
    'delivery.cargo': 'Cargo Delivery',
    'delivery.package_type': 'Package Type',
    'delivery.weight': 'Weight',
    'delivery.dimensions': 'Dimensions',
    'delivery.fragile': 'Fragile',
    'delivery.urgent': 'Urgent',
    'delivery.instructions': 'Instructions',
    'delivery.recipient_name': 'Recipient Name',
    'delivery.recipient_phone': 'Recipient Phone',
    'delivery.delivery_time': 'Delivery Time',
    'delivery.status.pending': 'Pending',
    'delivery.status.picked_up': 'Picked Up',
    'delivery.status.in_transit': 'In Transit',
    'delivery.status.delivered': 'Delivered',
    'delivery.status.cancelled': 'Cancelled',
    
    // Marketplace
    'marketplace.products': 'Products',
    'marketplace.categories': 'Categories',
    'marketplace.cart': 'Cart',
    'marketplace.favorites': 'Favorites',
    'marketplace.orders': 'Orders',
    'marketplace.sell': 'Sell',
    'marketplace.buy': 'Buy',
    'marketplace.add_to_cart': 'Add to Cart',
    'marketplace.checkout': 'Checkout',
    'marketplace.price': 'Price',
    'marketplace.description': 'Description',
    'marketplace.seller': 'Seller',
    'marketplace.rating': 'Rating',
    'marketplace.reviews': 'Reviews',
    'marketplace.stock': 'Stock',
    'marketplace.category': 'Category',
    
    // Driver
    'driver.dashboard': 'Dashboard',
    'driver.earnings': 'Earnings',
    'driver.trips': 'Trips',
    'driver.status': 'Status',
    'driver.online': 'Online',
    'driver.offline': 'Offline',
    'driver.available': 'Available',
    'driver.busy': 'Busy',
    'driver.accept_trip': 'Accept Trip',
    'driver.decline_trip': 'Decline Trip',
    'driver.start_trip': 'Start Trip',
    'driver.complete_trip': 'Complete Trip',
    'driver.vehicle_info': 'Vehicle Info',
    'driver.license': 'License',
    'driver.rating': 'Rating',
    'driver.total_trips': 'Total Trips',
    
    // Wallet
    'wallet.balance': 'Balance',
    'wallet.topup': 'Top Up',
    'wallet.withdraw': 'Withdraw',
    'wallet.history': 'History',
    'wallet.transaction': 'Transaction',
    'wallet.amount': 'Amount',
    'wallet.fee': 'Fee',
    'wallet.total': 'Total',
    'wallet.pending': 'Pending',
    'wallet.completed': 'Completed',
    'wallet.failed': 'Failed',
    
    // Notifications
    'notification.new_trip': 'New trip available',
    'notification.trip_accepted': 'Trip accepted',
    'notification.driver_arrived': 'Driver arrived',
    'notification.trip_started': 'Trip started',
    'notification.trip_completed': 'Trip completed',
    'notification.payment_received': 'Payment received',
    'notification.promotion': 'Special promotion',
    'notification.system': 'System notification',
    
    // Cities
    'city.kinshasa': 'Kinshasa',
    'city.lubumbashi': 'Lubumbashi', 
    'city.kolwezi': 'Kolwezi',
    
    // Kinshasa Districts
    'location.gombe': 'Gombe',
    'location.kinshasa': 'Kinshasa',
    'location.lemba': 'Lemba',
    'location.ngaliema': 'Ngaliema',
    'location.matete': 'Matete',
    'location.masina': 'Masina',
    'location.ndjili': 'N\'djili',
    'location.kimbanseke': 'Kimbanseke',
    'location.kalamu': 'Kalamu',
    'location.limete': 'Limete',
    'location.kintambo': 'Kintambo',
    
    // Lubumbashi Districts
    'location.kenya': 'Kenya',
    'location.kampemba': 'Kampemba',
    'location.kamalondo': 'Kamalondo',
    'location.katuba': 'Katuba',
    'location.ruashi': 'Ruashi',
    'location.annexe': 'Annexe',
    
    // Kolwezi Districts
    'location.centre_ville': 'Downtown',
    'location.mutanda': 'Mutanda',
    'location.dilala': 'Dilala',
    'location.manika': 'Manika',
    
    // Payment
    'payment.mobile_money': 'Mobile Money',
    'payment.airtel': 'Airtel Money',
    'payment.mpesa': 'M-Pesa',
    'payment.orange': 'Orange Money',
    'payment.amount': 'Amount',
    'payment.phone': 'Phone Number',
    'payment.confirm': 'Confirm Payment',
    'payment.method': 'Payment Method',
    'payment.cash': 'Cash',
    'payment.wallet': 'Wallet',
    'payment.card': 'Card',
    'payment.status.pending': 'Pending',
    'payment.status.success': 'Success',
    'payment.status.failed': 'Failed',
    
    // Referral
    'referral.title': 'Referral System',
    'referral.code': 'Referral Code',
    'referral.invite': 'Invite Friends',
    'referral.rewards': 'Rewards',
    'referral.total_earned': 'Total Earned',
    'referral.share': 'Share',
    'referral.copy_code': 'Copy Code',
    
    // Profile
    'profile.edit': 'Edit Profile',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.address': 'Address',
    'profile.photo': 'Photo',
    'profile.verification': 'Verification',
    'profile.documents': 'Documents',
    'profile.preferences': 'Preferences',
    'profile.language': 'Language',
    'profile.notifications': 'Notifications',
    'profile.privacy': 'Privacy',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.offline': 'Offline',
    'common.retry': 'Retry',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.details': 'Details',
    'common.close': 'Close',
    'common.select': 'Select',
    'common.upload': 'Upload',
    'common.download': 'Download',
    'common.share': 'Share',
    'common.copy': 'Copy',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.done': 'Done',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.skip': 'Skip',
    'common.help': 'Help',
    'common.about': 'About',
    'common.contact': 'Contact',
    'common.terms': 'Terms',
    'common.privacy': 'Privacy',
    'common.user': 'User',
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