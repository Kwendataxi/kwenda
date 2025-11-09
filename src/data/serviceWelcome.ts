import { UtensilsCrossed, ShoppingBag, Car, Ticket, LucideIcon } from 'lucide-react';

export interface ServiceSlide {
  id: string;
  service: 'food' | 'marketplace' | 'transport' | 'lottery';
  title: string;
  subtitle: string;
  description: string;
  lucideIcon: LucideIcon;
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
    description: 'Découvrez les meilleurs plats de Kinshasa, Lubumbashi et Kolwezi.',
    lucideIcon: UtensilsCrossed,
    gradient: 'from-orange-500/20 via-amber-500/10 to-orange-600/20',
    ctaText: 'Commander maintenant',
    ctaPath: '/food'
  },
  {
    id: 'welcome_shop',
    service: 'marketplace',
    title: 'Kwenda Shop',
    subtitle: 'Marketplace pour acheter et vendre',
    description: 'Rejoignez des milliers de vendeurs et acheteurs sur Kwenda Shop.',
    lucideIcon: ShoppingBag,
    gradient: 'from-blue-500/20 via-indigo-500/10 to-purple-600/20',
    ctaText: 'Explorer la marketplace',
    ctaPath: '/marketplace'
  },
  {
    id: 'welcome_transport',
    service: 'transport',
    title: 'Services de Transport',
    subtitle: 'Déplacements rapides dans votre ville',
    description: 'Taxi-bus, moto-taxi, VTC privé... Choisissez le transport adapté à vos besoins.',
    lucideIcon: Car,
    gradient: 'from-green-500/20 via-emerald-500/10 to-teal-600/20',
    ctaText: 'Réserver une course',
    ctaPath: '/transport'
  },
  {
    id: 'welcome_lottery',
    service: 'lottery',
    title: 'Tombola Kwenda',
    subtitle: 'Gagnez des récompenses gratuitement',
    description: 'Recevez des tickets gratuits à chaque course, livraison ou parrainage.',
    lucideIcon: Ticket,
    gradient: 'from-pink-500/20 via-rose-500/10 to-red-600/20',
    ctaText: 'Voir mes tickets',
    ctaPath: '/lottery'
  }
];
