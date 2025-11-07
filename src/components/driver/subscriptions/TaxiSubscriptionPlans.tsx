/**
 * 🚗 Plans d'abonnement pour chauffeurs taxi
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const taxiPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'Gratuit',
    icon: '🚗',
    gradient: 'from-gray-500 to-gray-600',
    features: [
      '10% commission',
      'Max 20 courses/jour',
      'Support standard',
      'Accès plateforme'
    ],
    limitations: [
      'Commission élevée',
      'Limite quotidienne'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5000,
    period: 'par mois',
    icon: '⚡',
    gradient: 'from-blue-500 to-blue-600',
    popular: true,
    features: [
      '5% commission seulement',
      'Courses illimitées',
      'Support prioritaire',
      'Analytics avancées',
      'Badge Pro visible'
    ],
    savings: 'Économisez jusqu\'à 50% sur les commissions'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 15000,
    period: 'par mois',
    icon: '👑',
    gradient: 'from-purple-500 to-purple-600',
    features: [
      '2% commission ultra-basse',
      'Courses illimitées',
      'Support 24/7 dédié',
      'Priorité dispatch automatique',
      'Analytics temps réel',
      'Badge Premium exclusif',
      'Bonus fidélité +20%'
    ],
    savings: 'Pour chauffeurs professionnels',
    badge: 'RECOMMANDÉ'
  }
];

export const TaxiSubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      // TODO: Intégrer avec le système de paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Abonnement activé avec succès !');
      setSelectedPlan(planId);
    } catch (error) {
      toast.error('Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground"
        >
          Plans Chauffeur Taxi
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Choisissez le plan qui correspond à votre activité
        </motion.p>
      </div>

      {/* Plans */}
      <div className="grid gap-6">
        {taxiPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative overflow-hidden p-6 ${
              plan.popular ? 'border-2 border-blue-500 shadow-lg' : ''
            }`}>
              {/* Badge recommandé */}
              {plan.badge && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              {/* Popular indicator */}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
              )}

              {/* Header du plan */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{plan.icon}</span>
                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                    {plan.popular && (
                      <Crown className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  {plan.savings && (
                    <p className="text-sm text-blue-500 font-medium">
                      {plan.savings}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} CDF`}
                  </div>
                  <div className="text-sm text-muted-foreground">{plan.period}</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limitations (si présentes) */}
              {plan.limitations && (
                <div className="mb-6 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                  {plan.limitations.map((limitation, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      • {limitation}
                    </p>
                  ))}
                </div>
              )}

              {/* CTA */}
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading || selectedPlan === plan.id}
                className={`w-full ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    : plan.id === 'premium'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                    : ''
                }`}
              >
                {selectedPlan === plan.id ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Plan actif
                  </>
                ) : plan.price === 0 ? (
                  'Plan actuel'
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Activer {plan.name}
                  </>
                )}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info supplémentaire */}
      <Card className="p-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Changez de plan à tout moment
            </h4>
            <p className="text-sm text-muted-foreground">
              Aucun engagement, annulez ou changez votre plan quand vous voulez. 
              Les upgrades sont instantanés.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
