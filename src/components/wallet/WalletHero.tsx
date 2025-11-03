import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Gift } from 'lucide-react';
import { AnimatedBalance } from './AnimatedBalance';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8 pt-12"
    >
      {/* Header discret */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            KwendaPay
          </span>
        </div>
        
        {status === 'active' && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Actif
          </span>
        )}
      </div>

      {/* Solde principal GÉANT */}
      <div className="text-center mb-6">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
          Solde disponible
        </p>
        <AnimatedBalance 
          value={balance} 
          currency={currency}
          className="text-5xl font-black text-foreground"
        />
      </div>

      {/* Solde Bonus - Toujours visible avec design distinctif */}
      <div className="flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10">
            <Gift className="h-4 w-4 text-orange-600" />
          </div>
          <span className="text-sm text-orange-900/70 font-medium">Solde Bonus:</span>
        </div>
        <span className="text-base font-bold text-orange-600">
          {bonusBalance.toLocaleString('fr-CD')} {currency}
        </span>
      </div>

      {/* Note explicative discrète si bonus = 0 */}
      {bonusBalance === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Convertissez vos points pour obtenir des bonus
        </p>
      )}
    </motion.div>
  );
};
