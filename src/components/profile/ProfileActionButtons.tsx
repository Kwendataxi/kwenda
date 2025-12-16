import React, { useState } from 'react';
import { Tag, Gift, CreditCard, Star, Ticket, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useVIPStatus } from '@/hooks/useVIPStatus';
import { PromoCodePanel } from './PromoCodePanel';

interface ProfileActionButtonsProps {
  onQuickAction?: (action: string) => void;
  className?: string;
}

export const ProfileActionButtons = ({ onQuickAction, className }: ProfileActionButtonsProps) => {
  const { vipStatus, loading: vipLoading } = useVIPStatus();
  const [showPromoCode, setShowPromoCode] = useState(false);

  const handleReferral = () => {
    onQuickAction?.('referral');
  };

  const handlePromoCode = () => {
    setShowPromoCode(true);
    onQuickAction?.('promocode');
  };

  const handleTombola = () => {
    onQuickAction?.('tombola');
  };

  const handleWallet = () => {
    onQuickAction?.('wallet');
  };

  const quickActions = [
    {
      id: 'referral',
      icon: Gift,
      label: 'Parrainage',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-500',
      action: handleReferral
    },
    {
      id: 'promocode',
      icon: Tag,
      label: 'Promos',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      iconColor: 'text-orange-500',
      action: handlePromoCode
    },
    {
      id: 'tombola',
      icon: Ticket,
      label: 'Tombola',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-purple-500',
      action: handleTombola,
      hasNotification: true
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* KwendaPay Wallet */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 p-5 shadow-lg cursor-pointer group"
        onClick={handleWallet}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-white text-lg font-bold">KwendaPay</span>
            <div className="text-white/80 text-sm">Mon portefeuille</div>
          </div>
          <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
            <ChevronRight className="h-5 w-5 text-white group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={action.action}
            className={cn(
              "relative rounded-xl p-4 transition-all",
              "hover:scale-[1.02] active:scale-95",
              "flex flex-col items-center gap-2",
              "bg-card border border-border/50",
              "hover:border-rose-200 dark:hover:border-rose-800/50 hover:shadow-sm"
            )}
          >
            <div className={cn("p-2.5 rounded-lg", action.bgColor)}>
              <action.icon className={cn("h-5 w-5", action.iconColor)} />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
            
            {action.hasNotification && (
              <span className="absolute top-2 right-2 h-2 w-2 bg-pink-500 rounded-full" />
            )}
          </motion.button>
        ))}
      </div>

      {/* VIP Status */}
      {!vipLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30"
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${vipStatus.currentLevel.color}15` }}
            >
              <Star 
                className="h-5 w-5" 
                style={{ color: vipStatus.currentLevel.color }}
                fill={vipStatus.currentLevel.color}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Statut VIP</span>
                <span className="text-base">{vipStatus.currentLevel.icon}</span>
                <span 
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: `${vipStatus.currentLevel.color}15`,
                    color: vipStatus.currentLevel.color
                  }}
                >
                  {vipStatus.currentLevel.name}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${vipStatus.progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: vipStatus.currentLevel.color }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {vipStatus.nextLevel 
                  ? `${vipStatus.ridesUntilNext} courses pour ${vipStatus.nextLevel.name}`
                  : 'Niveau maximum atteint'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <PromoCodePanel 
        open={showPromoCode} 
        onClose={() => setShowPromoCode(false)}
      />
    </div>
  );
};
