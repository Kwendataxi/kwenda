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
    toast({
      title: "KwendaPay",
      description: "Ouverture de votre portefeuille...",
    });
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
      variant: 'glow' as const,
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
    <div className={cn("space-y-4", className)}>
      {/* Primary Action Button */}
      <div className="relative">
        <CongoButton
          variant={primaryAction.variant}
          size="lg"
          onClick={primaryAction.action}
          className="w-full group relative overflow-hidden"
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
          
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </CongoButton>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-3 gap-2">
        {quickActions.map((action) => (
          <CongoButton
            key={action.id}
            variant={action.variant}
            size="sm"
            onClick={action.action}
            className="flex-col h-18 group relative overflow-hidden text-center p-2"
          >
            <action.icon className="h-4 w-4 mb-1 group-hover:scale-110 transition-transform mx-auto" />
            <span className="text-xs font-medium leading-tight">{action.label}</span>
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
          </CongoButton>
        ))}
      </div>

      {/* Secondary Actions Row */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowNotifications(true)}
          className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group relative"
        >
          <Bell className="h-4 w-4 text-congo-yellow group-hover:text-congo-yellow-electric transition-colors" />
          <span className="text-sm font-medium">Notifications</span>
          <div className="ml-auto">
            <NotificationBadge count={unreadCount} />
          </div>
        </button>

        <button
          onClick={() => onQuickAction?.('settings')}
          className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
        >
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-congo-blue transition-colors" />
        </button>
      </div>

      {/* VIP Status Indicator */}
      {!vipLoading && (
        <div className="bg-card border border-border shadow-lg rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${vipStatus.currentLevel.color}20` }}
            >
              <Star 
                className="h-4 w-4" 
                style={{ color: vipStatus.currentLevel.color }}
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium flex items-center gap-2">
                Statut VIP
                <span className="text-lg">{vipStatus.currentLevel.icon}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {vipStatus.nextLevel 
                  ? `${vipStatus.ridesUntilNext} courses pour passer ${vipStatus.nextLevel.name}`
                  : 'Niveau maximum atteint !'
                }
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: vipStatus.currentLevel.color }}
              >
                {vipStatus.currentLevel.name}
              </div>
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r rounded-full transition-all duration-500"
                  style={{ 
                    width: `${vipStatus.progressPercentage}%`,
                    background: `linear-gradient(90deg, ${vipStatus.currentLevel.color}, ${vipStatus.nextLevel?.color || vipStatus.currentLevel.color})`
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