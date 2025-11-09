export interface ServiceSlide {
  id: string;
  service: 'food' | 'marketplace' | 'transport' | 'lottery';
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  heroImage: string;
  icon: string;
  gradient: string;
  ctaText: string;
  ctaPath: string;
}

export const serviceWelcomeSlides: ServiceSlide[] = [
  {
    id: 'welcome_food',
    service: 'food',
    title: 'Kwenda Food',
    subtitle: 'Vos restaurants préférés livrés chez vous',
    description: 'Découvrez les meilleurs plats de Kinshasa, Lubumbashi, Kolwezi et Abidjan. Commandez en quelques clics et suivez votre livraison en temps réel.',
    features: [
      'Large choix de restaurants',
      'Livraison rapide en moto',
      'Suivi en temps réel',
      'Paiement sécurisé'
    ],
    heroImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop&q=80',
    icon: '🍔',
    gradient: 'from-orange-500/90 via-amber-500/90 to-orange-600/90',
    ctaText: 'Commander maintenant',
    ctaPath: '/food'
  },
  {
    id: 'welcome_shop',
    service: 'marketplace',
    title: 'Kwenda Shop',
    subtitle: 'Marketplace pour acheter et vendre',
    description: 'Rejoignez des milliers de vendeurs et acheteurs sur Kwenda Shop. Vendez vos produits ou trouvez ce que vous cherchez.',
    features: [
      'Milliers de produits disponibles',
      'Chat direct avec vendeurs',
      'Livraison intégrée',
      'Transactions sécurisées'
    ],
    heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80',
    icon: '🛍️',
    gradient: 'from-blue-500/90 via-indigo-500/90 to-purple-600/90',
    ctaText: 'Explorer la marketplace',
    ctaPath: '/marketplace'
  },
  {
    id: 'welcome_transport',
    service: 'transport',
    title: 'Services de Transport',
    subtitle: 'Déplacements rapides dans votre ville',
    description: 'Taxi-bus, moto-taxi, VTC privé... Choisissez le moyen de transport adapté à vos besoins et votre budget.',
    features: [
      'Plusieurs types de véhicules',
      'Tarifs transparents',
      'Chauffeurs vérifiés',
      'Disponible 4 villes'
    ],
    heroImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop&q=80',
    icon: '🚗',
    gradient: 'from-green-500/90 via-emerald-500/90 to-teal-600/90',
    ctaText: 'Réserver une course',
    ctaPath: '/transport'
  },
  {
    id: 'welcome_lottery',
    service: 'lottery',
    title: 'Tombola Kwenda',
    subtitle: 'Gagnez des récompenses gratuitement',
    description: 'Recevez des tickets gratuits à chaque course, livraison ou parrainage. Des tirages quotidiens avec des crédits KwendaPay à gagner.',
    features: [
      'Tickets gratuits offerts',
      'Tirages quotidiens',
      'Récompenses en crédits',
      'Plus d\'actions = plus de chances'
    ],
    heroImage: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&h=600&fit=crop&q=80',
    icon: '🎟️',
    gradient: 'from-pink-500/90 via-rose-500/90 to-red-600/90',
    ctaText: 'Voir mes tickets',
    ctaPath: '/lottery'
  }
];
