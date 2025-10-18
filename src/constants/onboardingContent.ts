import { 
  Car, PackageCheck, ShoppingBag, CarFront, UtensilsCrossed,
  Gauge, CreditCard, Shield,
  Layers, TrendingUp, Wallet,
  Store, ShoppingCart, Lock,
  Monitor, AlertTriangle, ShieldCheck,
  LucideIcon
} from "lucide-react";

export type OnboardingContext = "client" | "chauffeur" | "partenaire" | "marketplace" | "admin";

export interface OnboardingSlideContent {
  icon: LucideIcon;
  title: string;
  tagline: string;
  benefits: string[];
  gradient: string;
}

export const onboardingContent: Record<OnboardingContext, OnboardingSlideContent[]> = {
  client: [
    {
      icon: Car,
      title: "Réservez un trajet en 2 taps",
      tagline: "Moto, Taxi, Bus – au meilleur prix",
      benefits: [
        "Choix de véhicules selon votre budget",
        "Suivi GPS en temps réel",
        "Prix transparents et compétitifs",
        "Paiement sécurisé KwendaPay"
      ],
      gradient: "from-red-500/10 via-background to-background"
    },
    {
      icon: PackageCheck,
      title: "Livraison express & cargo",
      tagline: "Envoyez vos colis rapidement partout",
      benefits: [
        "Flash : Livraison moto express",
        "Flex : Standard économique",
        "Maxicharge : Gros volumes en camion",
        "Tracking temps réel de votre colis"
      ],
      gradient: "from-orange-500/10 via-background to-background"
    },
    {
      icon: UtensilsCrossed,
      title: "Commandez vos repas préférés",
      tagline: "Restaurants locaux, livraison rapide",
      benefits: [
        "Large choix de restaurants à Kinshasa",
        "Menu varié : Congolais, Italien, Français...",
        "Suivi de commande en temps réel",
        "Livraison express par nos coursiers"
      ],
      gradient: "from-green-500/10 via-background to-background"
    },
    {
      icon: ShoppingBag,
      title: "Marketplace intégrée",
      tagline: "Achetez et vendez en toute sécurité",
      benefits: [
        "E-commerce local certifié",
        "Chat vendeur-acheteur intégré",
        "Paiement escrow sécurisé",
        "Livraison directe par Kwenda"
      ],
      gradient: "from-purple-500/10 via-background to-background"
    },
    {
      icon: CarFront,
      title: "Louez votre véhicule idéal",
      tagline: "À partir de 50 000 CDF/jour",
      benefits: [
        "Véhicules récents et entretenus",
        "Avec ou sans chauffeur",
        "Assurance tous risques incluse",
        "Disponible dans 3 villes"
      ],
      gradient: "from-blue-600/10 via-background to-background"
    }
  ],
  
  chauffeur: [
    {
      icon: Gauge,
      title: "Dashboard de gains en temps réel",
      tagline: "Suivez vos performances instantanément",
      benefits: [
        "Revenus quotidiens actualisés",
        "Statistiques de courses détaillées",
        "Système de défis et récompenses",
        "Codes de parrainage rentables"
      ],
      gradient: "from-amber-500/10 via-background to-background"
    },
    {
      icon: CreditCard,
      title: "Abonnements & crédits flexibles",
      tagline: "Optimisez vos revenus avec nos plans",
      benefits: [
        "Plans adaptés à votre rythme",
        "Crédits pour accepter plus de courses",
        "Wallet KwendaPay intégré",
        "Retraits instantanés disponibles"
      ],
      gradient: "from-yellow-500/10 via-background to-background"
    },
    {
      icon: Shield,
      title: "Validation multi-niveaux sécurisée",
      tagline: "Un processus transparent et rapide",
      benefits: [
        "Documents vérifiés par l'équipe",
        "Validation partenaire incluse",
        "Processus clair étape par étape",
        "Support dédié chauffeurs"
      ],
      gradient: "from-green-500/10 via-background to-background"
    }
  ],
  
  partenaire: [
    {
      icon: Layers,
      title: "Administrez votre flotte facilement",
      tagline: "Gestion centralisée multi-véhicules",
      benefits: [
        "Vue d'ensemble de vos chauffeurs",
        "Validation des nouveaux conducteurs",
        "Suivi des performances par véhicule",
        "Affectation intelligente des courses"
      ],
      gradient: "from-emerald-500/10 via-background to-background"
    },
    {
      icon: TrendingUp,
      title: "Analytics en temps réel",
      tagline: "Visualisez vos KPIs clés instantanément",
      benefits: [
        "Dashboard financier détaillé",
        "Graphiques de tendances",
        "Rapports exportables PDF/Excel",
        "Alertes de performance"
      ],
      gradient: "from-teal-500/10 via-background to-background"
    },
    {
      icon: Wallet,
      title: "Gestion financière avancée",
      tagline: "Comptes, retraits, partages de revenus",
      benefits: [
        "Commissions automatisées",
        "Système de retraits sécurisé",
        "Partage de revenus avec chauffeurs",
        "Historique complet des transactions"
      ],
      gradient: "from-cyan-500/10 via-background to-background"
    }
  ],
  
  marketplace: [
    {
      icon: Store,
      title: "Vendez sans friction",
      tagline: "Mettez en ligne et finalisez rapidement",
      benefits: [
        "Upload de produits simplifié",
        "Chat direct avec les acheteurs",
        "Paiement escrow sécurisé",
        "Modération automatique"
      ],
      gradient: "from-violet-500/10 via-background to-background"
    },
    {
      icon: ShoppingCart,
      title: "Achetez en confiance",
      tagline: "Produits validés, chat intégré, suivi",
      benefits: [
        "Vendeurs certifiés uniquement",
        "Messagerie en temps réel",
        "Garantie de livraison",
        "Système de notation transparent"
      ],
      gradient: "from-fuchsia-500/10 via-background to-background"
    },
    {
      icon: Lock,
      title: "KwendaPay 100% sécurisé",
      tagline: "Paiements rapides, portefeuille CDF",
      benefits: [
        "Fonds bloqués jusqu'à livraison",
        "Rechargement par Mobile Money",
        "Historique complet accessible",
        "Support client réactif"
      ],
      gradient: "from-pink-500/10 via-background to-background"
    }
  ],
  
  admin: [
    {
      icon: Monitor,
      title: "Supervision totale centralisée",
      tagline: "Opérations, support, finances et zones",
      benefits: [
        "Dashboard global en temps réel",
        "Gestion multi-villes (Kinshasa, Lubumbashi...)",
        "Contrôle des zones tarifaires",
        "Modération de tous les services"
      ],
      gradient: "from-slate-500/10 via-background to-background"
    },
    {
      icon: AlertTriangle,
      title: "Alertes & widgets temps réel",
      tagline: "Gardez le contrôle avec des notifications live",
      benefits: [
        "Alertes fraudes et anomalies",
        "Métriques clés actualisées",
        "Logs détaillés des actions",
        "Notifications push critiques"
      ],
      gradient: "from-gray-500/10 via-background to-background"
    },
    {
      icon: ShieldCheck,
      title: "Modération & sécurité RLS",
      tagline: "Vérifications et conformité automatisées",
      benefits: [
        "Row Level Security (RLS) actif",
        "Validation de documents IA",
        "Système de signalement",
        "Audit trail complet"
      ],
      gradient: "from-zinc-500/10 via-background to-background"
    }
  ]
};

export const contextColors: Record<OnboardingContext, string> = {
  client: "hsl(var(--destructive))",
  chauffeur: "hsl(var(--warning))",
  partenaire: "hsl(var(--success))",
  marketplace: "hsl(var(--chart-5))",
  admin: "hsl(var(--muted-foreground))"
};
