import React from 'react';
import { Plus, Zap, Gift, CreditCard, Bell, Settings, Star } from 'lucide-react';
import CongoButton from '@/components/ui/CongoButton';
import { cn } from '@/lib/utils';

interface ProfileActionButtonsProps {
  onQuickAction?: (action: string) => void;
  className?: string;
}

export const ProfileActionButtons = ({ onQuickAction, className }: ProfileActionButtonsProps) => {
  const quickActions = [
    {
      id: 'recharge',
      icon: Plus,
      label: 'Recharger',
      variant: 'electric' as const,
      description: 'Ajouter des fonds'
    },
    {
      id: 'boost',
      icon: Zap,
      label: 'Boost',
      variant: 'vibrant' as const,
      description: 'Priorité course'
    }
  ];

  const primaryAction = {
    id: 'wallet',
    icon: CreditCard,
    label: 'KwendaPay',
    variant: 'congo' as const,
    description: 'Mon portefeuille'
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Action Button */}
      <div className="relative">
        <CongoButton
          variant={primaryAction.variant}
          size="lg"
          onClick={() => onQuickAction?.(primaryAction.id)}
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
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <CongoButton
            key={action.id}
            variant={action.variant}
            size="md"
            onClick={() => onQuickAction?.(action.id)}
            className="flex-col h-20 group relative overflow-hidden"
          >
            <action.icon className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">{action.label}</span>
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
          </CongoButton>
        ))}
      </div>

      {/* Secondary Actions Row */}
      <div className="flex gap-2">
        <button
          onClick={() => onQuickAction?.('notifications')}
          className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
        >
          <Bell className="h-4 w-4 text-congo-yellow group-hover:text-congo-yellow-electric transition-colors" />
          <span className="text-sm font-medium">Notifications</span>
          <div className="ml-auto w-2 h-2 bg-congo-red rounded-full animate-pulse" />
        </button>

        <button
          onClick={() => onQuickAction?.('settings')}
          className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
        >
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-congo-blue transition-colors" />
        </button>
      </div>

      {/* VIP Status Indicator */}
      <div className="glassmorphism rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-congo-yellow/20 to-congo-red/20">
            <Star className="h-4 w-4 text-congo-yellow" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Statut VIP</div>
            <div className="text-xs text-muted-foreground">3 courses pour passer Gold</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-congo-yellow font-medium">Silver</div>
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-congo-yellow to-congo-red rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};