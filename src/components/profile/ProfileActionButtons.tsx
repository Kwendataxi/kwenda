import React, { useState } from 'react';
import { Tag, HelpCircle, Gift, CreditCard, Bell, Settings, Star } from 'lucide-react';
import CongoButton from '@/components/ui/CongoButton';
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

  const handleSupport = () => {
    console.log('Navigation vers le support unifié');
    onQuickAction?.('support');
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
      id: 'support',
      icon: HelpCircle,
      label: 'Support',
      variant: 'support' as const,
      description: 'Aide & assistance',
      action: handleSupport
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
      {/* Primary Action - Wallet simplifié */}
      <CongoButton
        variant={primaryAction.variant}
        size="lg"
        onClick={primaryAction.action}
        className="w-full group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
            <primaryAction.icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold">{primaryAction.label}</div>
            <div className="text-xs opacity-90">{primaryAction.description}</div>
          </div>
        </div>
      </CongoButton>

      {/* Quick Actions Grid minimaliste */}
      <div className="grid grid-cols-3 gap-2">
        {quickActions.map((action) => (
          <CongoButton
            key={action.id}
            variant={action.variant}
            size="sm"
            onClick={action.action}
            className="flex-col h-16 group text-center p-2"
          >
            <action.icon className="h-4 w-4 mb-1.5 group-hover:scale-105 transition-transform mx-auto" />
            <span className="text-xs font-medium leading-tight">{action.label}</span>
          </CongoButton>
        ))}
      </div>

      {/* Secondary Actions Row compact */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowNotifications(true)}
          className="flex-1 flex items-center gap-2.5 p-2.5 rounded-lg bg-card border border-border/30 hover:bg-accent/30 transition-colors group"
        >
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Notifications</span>
          <div className="ml-auto">
            <NotificationBadge count={unreadCount} />
          </div>
        </button>

        <button
          onClick={() => onQuickAction?.('settings')}
          className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/30 hover:bg-accent/30 transition-colors group"
        >
          <Settings className="h-4 w-4 text-primary" />
        </button>
      </div>

      {/* VIP Status simplifié */}
      {!vipLoading && (
        <div className="bg-card border border-border/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${vipStatus.currentLevel.color}20` }}
            >
              <Star 
                className="h-3.5 w-3.5" 
                style={{ color: vipStatus.currentLevel.color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center gap-1.5">
                Statut VIP
                <span className="text-base">{vipStatus.currentLevel.icon}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {vipStatus.nextLevel 
                  ? `${vipStatus.ridesUntilNext} courses pour ${vipStatus.nextLevel.name}`
                  : 'Niveau maximum atteint'
                }
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-xs font-medium mb-0.5"
                style={{ color: vipStatus.currentLevel.color }}
              >
                {vipStatus.currentLevel.name}
              </div>
              <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${vipStatus.progressPercentage}%`,
                    backgroundColor: vipStatus.currentLevel.color
                  }}
                />
              </div>
            </div>
          </div>
        </div>
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