import React from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { AnimatedBalance } from './AnimatedBalance';
import { useLanguage } from '@/contexts/LanguageContext';

interface WalletHeroProps {
  balance: number;
  mainBalance: number;
  bonusBalance: number;
  currency: string;
  status?: 'active' | 'limited' | 'suspended';
}

export const WalletHero: React.FC<WalletHeroProps> = ({
  balance,
  mainBalance,
  bonusBalance,
  currency,
  status = 'active'
}) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-congo-blue/5 via-congo-yellow/10 to-congo-red/5 dark:from-congo-blue/10 dark:via-congo-yellow/15 dark:to-congo-red/10 p-8 pt-8 wallet-congo-pattern"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-congo-red/5 via-congo-yellow/5 to-congo-green/5 dark:from-congo-red/10 dark:via-congo-yellow/10 dark:to-congo-green/10 animate-congo-gradient" style={{ backgroundSize: '200% 200%' }} />

      {/* Solde principal GÉANT */}
      <div className="relative text-center mb-6">
        <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mb-2 uppercase tracking-wide">
          {t('wallet.available_balance')}
        </p>
        <motion.div
          whileHover={{
            filter: 'drop-shadow(0 0 20px hsl(var(--congo-red)/0.4))'
          }}
          transition={{ duration: 0.3 }}
        >
          <AnimatedBalance 
            value={balance} 
            currency={currency}
            className="text-5xl font-black text-foreground dark:text-foreground transition-all duration-300"
          />
        </motion.div>
      </div>

      {/* Solde Bonus - Toujours visible avec design distinctif */}
      <div className="relative flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-congo-yellow/10 to-congo-yellow/20 dark:from-congo-yellow/15 dark:to-congo-yellow/25 rounded-2xl border border-congo-yellow/30 dark:border-congo-yellow/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-congo-yellow/10 dark:bg-congo-yellow/20">
            <Gift className="h-4 w-4 text-congo-yellow-vibrant dark:text-congo-yellow-electric" />
          </div>
          <span className="text-sm text-congo-yellow-vibrant dark:text-congo-yellow-electric font-medium">{t('wallet.bonus_balance')}</span>
        </div>
        <span className="text-base font-bold text-congo-yellow-vibrant dark:text-congo-yellow-electric">
          {bonusBalance.toLocaleString('fr-CD')} {currency}
        </span>
      </div>

      {/* Note explicative discrète si bonus = 0 */}
      {bonusBalance === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          {t('wallet.convert_points_info')}
        </p>
      )}
    </motion.div>
  );
};
