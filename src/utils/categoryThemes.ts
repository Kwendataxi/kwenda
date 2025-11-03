export const CATEGORY_THEMES: Record<string, {
  gradient: string;
  color: string;
  icon: string;
  description: string;
}> = {
  'Économique': {
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    color: 'text-green-600',
    icon: '🚗',
    description: 'Véhicules économiques pour un budget maîtrisé'
  },
  'Standard': {
    gradient: 'from-blue-500 via-sky-500 to-blue-600',
    color: 'text-blue-600',
    icon: '🚙',
    description: 'Confort et fiabilité au quotidien'
  },
  'Confort': {
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    color: 'text-purple-600',
    icon: '🚘',
    description: 'Expérience de conduite supérieure'
  },
  'Premium': {
    gradient: 'from-orange-500 via-amber-500 to-orange-600',
    color: 'text-orange-600',
    icon: '🏎️',
    description: 'Véhicules haut de gamme pour vos déplacements'
  },
  'Luxe': {
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    color: 'text-pink-600',
    icon: '💎',
    description: 'Excellence et prestige assurés'
  },
  'SUV': {
    gradient: 'from-indigo-500 via-violet-500 to-indigo-600',
    color: 'text-indigo-600',
    icon: '🚙',
    description: 'Robustesse et espace pour toute la famille'
  },
  'Familial': {
    gradient: 'from-teal-500 via-cyan-500 to-teal-600',
    color: 'text-teal-600',
    icon: '👨‍👩‍👧‍👦',
    description: 'Véhicules spacieux pour vos sorties en famille'
  },
  'Utilitaire': {
    gradient: 'from-gray-500 via-slate-500 to-gray-600',
    color: 'text-gray-600',
    icon: '🚐',
    description: 'Solutions pratiques pour vos besoins professionnels'
  }
};

export const getCategoryTheme = (categoryName: string) => {
  return CATEGORY_THEMES[categoryName] || {
    gradient: 'from-gray-400 to-gray-600',
    color: 'text-gray-600',
    icon: '🚗',
    description: 'Véhicules disponibles'
  };
};
