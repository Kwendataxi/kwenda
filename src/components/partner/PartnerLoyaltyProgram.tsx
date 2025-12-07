import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Star, Gift, TrendingUp, Check, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LoyaltyTier {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  minPoints: number;
  benefits: string[];
}

const loyaltyTiers: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: <Star className="h-6 w-6" />,
    color: 'text-amber-700',
    bgGradient: 'from-amber-600/20 to-amber-700/20',
    minPoints: 0,
    benefits: [
      'Accès au dashboard partenaire',
      'Support par email',
      'Commission standard 5%'
    ]
  },
  {
    id: 'silver',
    name: 'Argent',
    icon: <Star className="h-6 w-6" />,
    color: 'text-gray-500',
    bgGradient: 'from-gray-400/20 to-gray-500/20',
    minPoints: 1000,
    benefits: [
      'Tous les avantages Bronze',
      'Support prioritaire',
      'Commission réduite à 4%',
      'Badge vérifié sur le profil'
    ]
  },
  {
    id: 'gold',
    name: 'Or',
    icon: <Crown className="h-6 w-6" />,
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-400/20 to-yellow-600/20',
    minPoints: 5000,
    benefits: [
      'Tous les avantages Argent',
      'Gestionnaire de compte dédié',
      'Commission réduite à 3%',
      'Accès anticipé aux nouvelles fonctionnalités',
      'Priorité dans les affectations'
    ]
  },
  {
    id: 'platinum',
    name: 'Platine',
    icon: <Crown className="h-6 w-6" />,
    color: 'text-purple-500',
    bgGradient: 'from-purple-400/20 to-purple-600/20',
    minPoints: 15000,
    benefits: [
      'Tous les avantages Or',
      'Commission réduite à 2%',
      'Ligne directe avec la direction',
      'Invitations aux événements VIP',
      'Partenaire officiel certifié',
      'Bonus de fin d\'année'
    ]
  }
];

export const PartnerLoyaltyProgram = () => {
  const { user } = useAuth();
  const [currentPoints, setCurrentPoints] = useState(2500);
  const [currentTier, setCurrentTier] = useState<LoyaltyTier>(loyaltyTiers[1]);
  const [nextTier, setNextTier] = useState<LoyaltyTier | null>(loyaltyTiers[2]);

  useEffect(() => {
    // Déterminer le niveau actuel basé sur les points
    const tier = [...loyaltyTiers].reverse().find(t => currentPoints >= t.minPoints) || loyaltyTiers[0];
    setCurrentTier(tier);
    
    const tierIndex = loyaltyTiers.findIndex(t => t.id === tier.id);
    setNextTier(tierIndex < loyaltyTiers.length - 1 ? loyaltyTiers[tierIndex + 1] : null);
  }, [currentPoints]);

  const progressToNextTier = nextTier 
    ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const pointsToNextTier = nextTier ? nextTier.minPoints - currentPoints : 0;

  return (
    <div className="space-y-6">
      {/* Niveau actuel */}
      <Card className={cn("overflow-hidden border-2", currentTier.color.replace('text-', 'border-'))}>
        <div className={cn("bg-gradient-to-br p-6", currentTier.bgGradient)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn("p-4 rounded-2xl bg-background/80 backdrop-blur-sm", currentTier.color)}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {currentTier.icon}
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground">Votre niveau actuel</p>
                <h2 className={cn("text-2xl font-bold", currentTier.color)}>
                  Partenaire {currentTier.name}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{currentPoints.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">points de fidélité</p>
            </div>
          </div>

          {nextTier && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression vers {nextTier.name}</span>
                <span className="font-medium">{pointsToNextTier.toLocaleString()} points restants</span>
              </div>
              <Progress value={progressToNextTier} className="h-3" />
            </div>
          )}
        </div>
      </Card>

      {/* Comment gagner des points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Comment gagner des points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { action: 'Chaque course complétée', points: '+10 pts' },
              { action: 'Chaque livraison réussie', points: '+15 pts' },
              { action: 'Location de véhicule', points: '+50 pts' },
              { action: 'Note 5 étoiles reçue', points: '+25 pts' },
              { action: 'Nouveau chauffeur parrainé', points: '+100 pts' },
              { action: 'Objectif mensuel atteint', points: '+500 pts' },
            ].map((item, index) => (
              <motion.div
                key={item.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm">{item.action}</span>
                <Badge variant="secondary" className="font-mono">
                  {item.points}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tous les niveaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Niveaux et Avantages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loyaltyTiers.map((tier, index) => {
              const isUnlocked = currentPoints >= tier.minPoints;
              const isCurrent = tier.id === currentTier.id;
              
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    isCurrent && "border-primary bg-primary/5",
                    isUnlocked && !isCurrent && "border-border bg-muted/30",
                    !isUnlocked && "border-border/50 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isUnlocked ? tier.bgGradient : "bg-muted"
                      )}>
                        <span className={isUnlocked ? tier.color : "text-muted-foreground"}>
                          {tier.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className={cn("font-semibold", isUnlocked ? tier.color : "text-muted-foreground")}>
                          {tier.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {tier.minPoints.toLocaleString()} points requis
                        </p>
                      </div>
                    </div>
                    
                    {isCurrent ? (
                      <Badge className="bg-primary">Niveau actuel</Badge>
                    ) : isUnlocked ? (
                      <Badge variant="secondary">Débloqué</Badge>
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tier.benefits.map((benefit, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className={cn(
                          "h-4 w-4 shrink-0",
                          isUnlocked ? "text-green-500" : "text-muted-foreground"
                        )} />
                        <span className={isUnlocked ? "text-foreground" : "text-muted-foreground"}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
