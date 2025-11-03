import React, { useState } from 'react';
import { Tag, Gift, CreditCard, Bell, Settings, Star, Ticket, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useVIPStatus } from '@/hooks/useVIPStatus';
import { useToast } from '@/hooks/use-toast';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import { ReferralPanel } from './ReferralPanel';
import { PromoCodePanel } from './PromoCodePanel';


interface ProfileActionButtonsProps {
  onQuickAction?: (action: string) => void;
  className?: string;
}

export const ProfileActionButtons = ({ onQuickAction, className }: ProfileActionButtonsProps) => {
  const { toast } = useToast();
  const { unreadCount } = useOrderNotifications();
  const { vipStatus, loading: vipLoading } = useVIPStatus();
  const [showNotifications, setShowNotifications] = useState(false);
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
      variant: 'electric' as const,
      description: 'Inviter des amis',
      action: handleReferral
    },
    {
      id: 'promocode',
      icon: Tag,
      label: 'Promos',
      variant: 'vibrant' as const,
      description: 'Codes promo',
      action: handlePromoCode
    },
    {
      id: 'tombola',
      icon: Ticket,
      label: 'Tombola',
      variant: 'vibrant' as const,
      description: 'Tentez votre chance',
      action: handleTombola
    }
  ];

  const primaryAction = {
    id: 'wallet',
    icon: CreditCard,
    label: 'KwendaPay',
    variant: 'congo' as const,
    description: 'Mon portefeuille',
    action: handleWallet
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Primary Action - Wallet moderne */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
        onClick={primaryAction.action}
      >
        {/* Effet glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
        
        {/* Contenu */}
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-all group-hover:scale-110 duration-300">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white text-xl font-bold tracking-tight">
              KwendaPay
            </div>
            <div className="text-white/80 text-sm">
              Mon portefeuille
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </motion.div>

      {/* Quick Actions Grid moderne */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => {
          const gradients = {
            referral: 'from-blue-500 to-cyan-500',
            promocode: 'from-orange-500 to-pink-500',
            tombola: 'from-purple-500 to-fuchsia-500'
          };
          
          const bgColors = {
            referral: 'bg-blue-50 dark:bg-blue-950/30',
            promocode: 'bg-orange-50 dark:bg-orange-950/30',
            tombola: 'bg-purple-50 dark:bg-purple-950/30'
          };
          
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={action.action}
              className={cn(
                "relative overflow-hidden rounded-xl p-4 transition-all duration-300",
                "hover:scale-105 hover:shadow-lg active:scale-95",
                "flex flex-col items-center gap-2 group",
                bgColors[action.id as keyof typeof bgColors]
              )}
            >
              {/* Gradient au hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-gradient-to-br",
                gradients[action.id as keyof typeof gradients]
              )} />
              
              {/* Icône avec fond glassmorphism */}
              <div className="relative z-10 p-2.5 rounded-lg bg-white/80 dark:bg-black/20 backdrop-blur-sm group-hover:bg-white transition-all">
                <action.icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
              </div>
              
              {/* Label */}
              <span className="relative z-10 text-xs font-semibold text-foreground group-hover:text-white transition-colors">
                {action.label}
              </span>
              
              {/* Badge animé pour Tombola */}
              {action.id === 'tombola' && (
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-1 right-1 z-20"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
                  </span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Secondary Actions Row moderne */}
      <div className="flex gap-3">
        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(true)}
          className="flex-1 relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Notifications
            </span>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </div>
        </button>

        {/* Settings */}
        <button
          onClick={() => onQuickAction?.('settings')}
          className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border border-gray-200/50 dark:border-gray-800/50 hover:shadow-md transition-all group"
        >
          <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* VIP Status moderne */}
      {!vipLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50"
        >
          {/* Effet shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          
          <div className="relative flex items-center gap-3">
            {/* Icône VIP */}
            <div 
              className="p-2.5 rounded-xl backdrop-blur-sm"
              style={{ 
                backgroundColor: `${vipStatus.currentLevel.color}20`,
                border: `1px solid ${vipStatus.currentLevel.color}40`
              }}
            >
              <Star 
                className="h-5 w-5" 
                style={{ color: vipStatus.currentLevel.color }}
                fill={vipStatus.currentLevel.color}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-foreground">
                  Statut VIP
                </span>
                <span className="text-lg">{vipStatus.currentLevel.icon}</span>
                <span 
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: `${vipStatus.currentLevel.color}20`,
                    color: vipStatus.currentLevel.color
                  }}
                >
                  {vipStatus.currentLevel.name}
                </span>
              </div>
              
              {/* Barre de progression moderne */}
              <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${vipStatus.progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${vipStatus.currentLevel.color}, ${vipStatus.currentLevel.color}dd)`
                  }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {vipStatus.nextLevel 
                  ? `${vipStatus.ridesUntilNext} courses pour ${vipStatus.nextLevel.name}`
                  : '🎉 Niveau maximum atteint'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Panels */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
      <ReferralPanel 
        open={showReferral} 
        onClose={() => setShowReferral(false)} 
      />
      
      <PromoCodePanel 
        open={showPromoCode} 
        onClose={() => setShowPromoCode(false)} 
      />
      
    </div>
  );
};