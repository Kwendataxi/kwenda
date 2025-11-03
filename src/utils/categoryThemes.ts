export const CATEGORY_THEMES: Record<string, {
  gradient: string;
  color: string;
  icon: string;
  description: string;
}> = {
  // ✅ Catégories RÉELLES de la base de données
  'ECO': {
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    color: 'text-green-600',
    icon: '🚗',
    description: 'Véhicules abordables pour usage quotidien'
  },
  'Berline': {
    gradient: 'from-blue-500 via-sky-500 to-blue-600',
    color: 'text-blue-600',
    icon: '🚙',
    description: 'Confort, espace pour famille ou business'
  },
  'SUV & 4x4': {
    gradient: 'from-indigo-500 via-violet-500 to-indigo-600',
    color: 'text-indigo-600',
    icon: '🚙',
    description: 'Spacieux, robustes, adaptés aux routes difficiles'
  },
  'First Class': {
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    color: 'text-pink-600',
    icon: '💎',
    description: 'Véhicules de luxe avec service premium exclusif'
  },
  'Minibus': {
    gradient: 'from-teal-500 via-cyan-500 to-teal-600',
    color: 'text-teal-600',
    icon: '🚐',
    description: 'Transport de groupes et sorties en famille'
  },
  'Utilitaires': {
    gradient: 'from-gray-500 via-slate-500 to-gray-600',
    color: 'text-gray-600',
    icon: '📦',
    description: 'Véhicules utilitaires pour transport de marchandises'
  },
  'Tricycle': {
    gradient: 'from-amber-500 via-yellow-500 to-amber-600',
    color: 'text-amber-600',
    icon: '🛺',
    description: 'Tricycles pour trajets rapides et petites livraisons'
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
