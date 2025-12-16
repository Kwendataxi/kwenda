import React, { useState } from 'react';
import { Tag, Gift, CreditCard, Star, Ticket, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useVIPStatus } from '@/hooks/useVIPStatus';
import { useToast } from '@/hooks/use-toast';
import { PromoCodePanel } from './PromoCodePanel';


interface ProfileActionButtonsProps {
  onQuickAction?: (action: string) => void;
  className?: string;
}

export const ProfileActionButtons = ({ onQuickAction, className }: ProfileActionButtonsProps) => {
  const { toast } = useToast();
  const { vipStatus, loading: vipLoading } = useVIPStatus();
  const [showReferral, setShowReferral] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  

  const handleReferral = () => {
    setShowReferral(true);
    onQuickAction?.('referral');
  };

  const handlePromoCode = () => {
    setShowPromoCode(true);
    onQuickAction?.('promocode');
  };

  const handleTombola = () => {
    console.log('Navigation vers la tombola');
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
      description: 'Inviter des amis',
      gradient: 'from-blue-400 to-cyan-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-500',
      action: handleReferral
    },
    {
      id: 'promocode',
      icon: Tag,
      label: 'Promos',
      description: 'Codes promo',
      gradient: 'from-rose-400 to-orange-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30',
      iconColor: 'text-rose-500',
      action: handlePromoCode
    },
    {
      id: 'tombola',
      icon: Ticket,
      label: 'Tombola',
      description: 'Tentez votre chance',
      gradient: 'from-purple-400 to-pink-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-purple-500',
      action: handleTombola
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Action - KwendaPay Wallet Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 p-6 shadow-xl hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500 cursor-pointer group"
        onClick={handleWallet}
      >
        {/* Effet glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/5 to-transparent" />
        
        {/* Particules flottantes */}
        <div className="absolute top-3 right-6 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
        <div className="absolute bottom-4 right-12 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-8 right-20 w-1 h-1 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Contenu */}
        <div className="relative flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white text-xl font-bold tracking-tight">
                KwendaPay
              </span>
              <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
            </div>
            <div className="text-white/80 text-sm">
              Mon portefeuille
            </div>
          </div>
          <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-all">
            <ChevronRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid - Design soft et doux */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={action.action}
            className={cn(
              "relative overflow-hidden rounded-2xl p-4 transition-all duration-300",
              "hover:scale-105 hover:shadow-lg active:scale-95",
              "flex flex-col items-center gap-2.5 group",
              "bg-card/80 backdrop-blur-sm border border-border/50",
              "hover:border-violet-300/50 dark:hover:border-violet-700/50"
            )}
          >
            {/* Gradient au hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-br",
              action.gradient
            )} />
            
            {/* Icône avec fond glassmorphism */}
            <div className={cn(
              "relative z-10 p-3 rounded-xl transition-all duration-300",
              action.bgColor,
              "group-hover:bg-white/90 dark:group-hover:bg-white/20"
            )}>
              <action.icon className={cn(
                "h-5 w-5 transition-colors duration-300",
                action.iconColor,
                "group-hover:text-white"
              )} />
            </div>
            
            {/* Label */}
            <span className="relative z-10 text-xs font-semibold text-foreground group-hover:text-white transition-colors duration-300">
              {action.label}
            </span>
            
            {/* Badge animé pour Tombola */}
            {action.id === 'tombola' && (
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute top-2 right-2 z-20"
              >
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
                </span>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* VIP Status - Design premium soft */}
      {!vipLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-50/80 via-indigo-50/80 to-purple-50/80 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-violet-200/50 dark:border-violet-800/30 backdrop-blur-sm"
        >
          {/* Effet shimmer subtil */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer-slow" />
          
          <div className="relative flex items-center gap-3">
            {/* Icône VIP avec glow */}
            <div 
              className="p-3 rounded-xl backdrop-blur-sm shadow-sm"
              style={{ 
                backgroundColor: `${vipStatus.currentLevel.color}15`,
                border: `1px solid ${vipStatus.currentLevel.color}30`,
                boxShadow: `0 0 20px ${vipStatus.currentLevel.color}10`
              }}
            >
              <Star 
                className="h-5 w-5" 
                style={{ color: vipStatus.currentLevel.color }}
                fill={vipStatus.currentLevel.color}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-bold text-foreground">
                  Statut VIP
                </span>
                <span className="text-lg">{vipStatus.currentLevel.icon}</span>
                <span 
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: `${vipStatus.currentLevel.color}15`,
                    color: vipStatus.currentLevel.color
                  }}
                >
                  {vipStatus.currentLevel.name}
                </span>
              </div>
              
              {/* Barre de progression premium */}
              <div className="relative h-2.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${vipStatus.progressPercentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(90deg, ${vipStatus.currentLevel.color}cc, ${vipStatus.currentLevel.color})`
                  }}
                >
                  {/* Shimmer sur la barre */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1.5">
                {vipStatus.nextLevel 
                  ? `${vipStatus.ridesUntilNext} courses pour ${vipStatus.nextLevel.name}`
                  : '🎉 Niveau maximum atteint'
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

      {/* Styles pour les animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        .animate-shimmer-slow {
          animation: shimmer 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
