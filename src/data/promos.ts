import { Promo } from '@/types/promo';

export const defaultPromos: Promo[] = [
  {
    id: '1',
    title: '30% sur votre 1ère course',
    description: 'Code: BIENVENUE30',
    image: '',
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    cta: 'Commander',
    service: 'transport'
  },
  {
    id: '2',
    title: 'Livraison gratuite',
    description: 'Pour les commandes +10 000 CDF',
    image: '',
    gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
    cta: 'Découvrir',
    service: 'delivery'
  },
  {
    id: '3',
    title: 'Tombola KwendaPay',
    description: 'Gagnez jusqu\'à 100 000 CDF',
    image: '',
    gradient: 'from-purple-500 via-pink-500 to-purple-600',
    cta: 'Participer',
    service: 'lottery'
  },
  {
    id: '4',
    title: 'Location de véhicules',
    description: 'À partir de 50 000 CDF/jour',
    image: '',
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    cta: 'Réserver',
    service: 'rental'
  },
  {
    id: '5',
    title: 'Achetez. Vendez. On livre.',
    description: 'Marketplace 100% sécurisée',
    image: '',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    cta: 'Shopping',
    service: 'marketplace'
  }
];
