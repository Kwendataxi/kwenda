import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp } from 'lucide-react';
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

      {/* Soldes secondaires inline */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Principal:</span>
          <span className="font-semibold text-foreground">
            {mainBalance.toLocaleString('fr-CD')} {currency}
          </span>
        </div>
        
        {bonusBalance > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Bonus:</span>
              <span className="font-semibold text-orange-600">
                {bonusBalance.toLocaleString('fr-CD')} {currency}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
