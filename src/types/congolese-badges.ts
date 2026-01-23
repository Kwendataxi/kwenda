// Système de badges congolais collectionnables pour Kwenda Gratta

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CongoleseBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  requirement: string;
  requirementType: 'cards_scratched' | 'mega_cards' | 'consecutive_days' | 'xp_earned' | 'first_action' | 'city_based';
  requirementValue: number;
  cityVibe?: string;
  colors: string[];
}

export const CONGOLESE_BADGES: Record<string, CongoleseBadge> = {
  // 🌱 Badges débutant
  premier_gratta: {
    id: 'premier_gratta',
    name: 'Premier Gratta',
    description: 'Première carte grattée avec succès !',
    icon: '🎉',
    rarity: 'common',
    requirement: 'Gratte ta première carte',
    requirementType: 'first_action',
    requirementValue: 1,
    colors: ['#3B82F6', '#60A5FA']
  },

  gratteur_novice: {
    id: 'gratteur_novice',
    name: 'Gratteur Novice',
    description: '10 cartes grattées, tu commences bien !',
    icon: '🌟',
    rarity: 'common',
    requirement: '10 cartes grattées',
    requirementType: 'cards_scratched',
    requirementValue: 10,
    colors: ['#10B981', '#34D399']
  },

  // 🔥 Badges réguliers
  gratteur_quotidien: {
    id: 'gratteur_quotidien',
    name: 'Gratteur Quotidien',
    description: '7 jours de grattage consécutifs !',
    icon: '📅',
    rarity: 'rare',
    requirement: '7 jours consécutifs',
    requirementType: 'consecutive_days',
    requirementValue: 7,
    colors: ['#8B5CF6', '#A78BFA']
  },

  chasseur_de_chance: {
    id: 'chasseur_de_chance',
    name: 'Chasseur de Chance',
    description: '50 cartes grattées, tu es accro !',
    icon: '🍀',
    rarity: 'rare',
    requirement: '50 cartes grattées',
    requirementType: 'cards_scratched',
    requirementValue: 50,
    colors: ['#22C55E', '#4ADE80']
  },

  // 🏆 Badges villes congolaises
  kinois_champion: {
    id: 'kinois_champion',
    name: 'Kinois Champion',
    description: 'Roi du grattage à Kinshasa !',
    icon: '🏆',
    rarity: 'legendary',
    requirement: '100 cartes grattées',
    requirementType: 'cards_scratched',
    requirementValue: 100,
    cityVibe: 'Kinshasa',
    colors: ['#F59E0B', '#FBBF24', '#FCD34D']
  },

  legende_lubumbashi: {
    id: 'legende_lubumbashi',
    name: 'Légende de Lubumbashi',
    description: 'Champion légendaire du Katanga !',
    icon: '⚡',
    rarity: 'legendary',
    requirement: '5 cartes Méga gagnées',
    requirementType: 'mega_cards',
    requirementValue: 5,
    cityVibe: 'Lubumbashi',
    colors: ['#EF4444', '#F87171', '#FCA5A5']
  },

  chanceux_kolwezi: {
    id: 'chanceux_kolwezi',
    name: 'Chanceux de Kolwezi',
    description: 'La chance des mines de Kolwezi !',
    icon: '💎',
    rarity: 'epic',
    requirement: '3 cartes Méga gagnées',
    requirementType: 'mega_cards',
    requirementValue: 3,
    cityVibe: 'Kolwezi',
    colors: ['#06B6D4', '#22D3EE']
  },

  abidjanais_fute: {
    id: 'abidjanais_fute',
    name: 'Abidjanais Futé',
    description: 'Champion Gratta à Abidjan !',
    icon: '🌴',
    rarity: 'epic',
    requirement: '75 cartes grattées',
    requirementType: 'cards_scratched',
    requirementValue: 75,
    cityVibe: 'Abidjan',
    colors: ['#F97316', '#FB923C']
  },

  // 👑 Badges prestigieux
  roi_du_grattage: {
    id: 'roi_du_grattage',
    name: 'Roi du Grattage',
    description: 'Maître absolu des cartes Kwenda !',
    icon: '👑',
    rarity: 'epic',
    requirement: '10 cartes Méga révélées',
    requirementType: 'mega_cards',
    requirementValue: 10,
    colors: ['#A855F7', '#C084FC']
  },

  mbongo_master: {
    id: 'mbongo_master',
    name: 'Mbongo Master',
    description: '10 000 XP accumulés au grattage !',
    icon: '💰',
    rarity: 'legendary',
    requirement: '10 000 XP gagnés',
    requirementType: 'xp_earned',
    requirementValue: 10000,
    colors: ['#EAB308', '#FACC15', '#FDE047']
  },

  // 🎯 Badges streaks
  semaine_parfaite: {
    id: 'semaine_parfaite',
    name: 'Semaine Parfaite',
    description: '14 jours de grattage consécutifs !',
    icon: '🔥',
    rarity: 'epic',
    requirement: '14 jours consécutifs',
    requirementType: 'consecutive_days',
    requirementValue: 14,
    colors: ['#DC2626', '#EF4444']
  },

  mois_de_feu: {
    id: 'mois_de_feu',
    name: 'Mois de Feu',
    description: '30 jours de grattage sans interruption !',
    icon: '🌋',
    rarity: 'legendary',
    requirement: '30 jours consécutifs',
    requirementType: 'consecutive_days',
    requirementValue: 30,
    colors: ['#B91C1C', '#DC2626', '#EF4444']
  }
};

// Ordre d'affichage par rareté
export const BADGE_RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common'];

// Configuration couleurs par rareté
export const BADGE_RARITY_CONFIG: Record<BadgeRarity, { bg: string; border: string; glow: string }> = {
  common: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-300 dark:border-slate-600',
    glow: ''
  },
  rare: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-500',
    glow: 'shadow-blue-500/20'
  },
  epic: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-400 dark:border-purple-500',
    glow: 'shadow-purple-500/30'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-yellow-900/30',
    border: 'border-yellow-400 dark:border-yellow-500',
    glow: 'shadow-yellow-500/40 shadow-lg'
  }
};

// Vérifier si un utilisateur remplit les conditions d'un badge
export const checkBadgeRequirement = (
  badge: CongoleseBadge,
  stats: {
    cardsScratched: number;
    megaCards: number;
    consecutiveDays: number;
    xpEarned: number;
  }
): boolean => {
  switch (badge.requirementType) {
    case 'cards_scratched':
      return stats.cardsScratched >= badge.requirementValue;
    case 'mega_cards':
      return stats.megaCards >= badge.requirementValue;
    case 'consecutive_days':
      return stats.consecutiveDays >= badge.requirementValue;
    case 'xp_earned':
      return stats.xpEarned >= badge.requirementValue;
    case 'first_action':
      return stats.cardsScratched >= 1;
    default:
      return false;
  }
};
