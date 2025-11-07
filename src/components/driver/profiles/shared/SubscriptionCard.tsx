/**
 * 💳 Carte abonnement réutilisable
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface SubscriptionCardProps {
  plan: 'free' | 'starter' | 'pro' | 'premium';
  expiresAt?: string;
  serviceType: 'taxi' | 'delivery';
}

export const SubscriptionCard = ({ plan, expiresAt, serviceType }: SubscriptionCardProps) => {
  const serviceColor = serviceType === 'taxi' ? 'blue' : 'green';
  
  const planLabels = {
    free: serviceType === 'taxi' ? 'Starter' : 'Flash Solo',
    starter: serviceType === 'taxi' ? 'Starter' : 'Flash Solo',
    pro: serviceType === 'taxi' ? 'Pro' : 'Flex Pro',
    premium: serviceType === 'taxi' ? 'Premium' : 'Maxicharge Business'
  };

  const planColors = {
    free: 'gray',
    starter: 'gray',
    pro: serviceColor,
    premium: 'purple'
  };

  const isPremium = plan === 'premium';
  const color = planColors[plan];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className={`p-6 bg-gradient-to-br from-${color}-500/10 to-transparent border-${color}-500/20`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className={`w-5 h-5 text-${color}-500`} />
            <h3 className="font-semibold text-foreground">Abonnement actif</h3>
          </div>
          {isPremium && (
            <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-semibold">
              Premium
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Plan actuel</p>
            <p className={`text-2xl font-bold text-${color}-500`}>
              {planLabels[plan]}
            </p>
          </div>

          {expiresAt && (
            <div>
              <p className="text-sm text-muted-foreground">Expire le</p>
              <p className="font-medium text-foreground">
                {format(new Date(expiresAt), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Avantages:</p>
            <ul className="space-y-1 text-sm text-foreground">
              {plan === 'free' || plan === 'starter' ? (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>10% commission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{serviceType === 'taxi' ? '20 courses/jour' : '30 livraisons/jour'}</span>
                  </li>
                </>
              ) : plan === 'pro' ? (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>5% commission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Courses illimitées</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>2% commission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Priorité dispatch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Support 24/7</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {plan !== 'premium' && (
            <Button className={`w-full bg-gradient-to-r from-${color}-500 to-${color}-600 hover:from-${color}-600 hover:to-${color}-700`}>
              Upgrade
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
