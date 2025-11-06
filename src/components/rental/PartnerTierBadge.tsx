import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PartnerTierBadgeProps {
  tier: string;
  className?: string;
}

export const PartnerTierBadge = ({ tier, className }: PartnerTierBadgeProps) => {
  const config: Record<string, { icon: string; color: string; label: string }> = {
    basic: { 
      icon: '🚗', 
      color: 'bg-slate-500 hover:bg-slate-600', 
      label: 'Starter' 
    },
    silver: { 
      icon: '🥈', 
      color: 'bg-gradient-to-r from-slate-400 to-slate-500', 
      label: 'Pro' 
    },
    gold: { 
      icon: '🥇', 
      color: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600', 
      label: 'Business' 
    },
    platinum: { 
      icon: '💎', 
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600', 
      label: 'Enterprise' 
    }
  };

  const c = config[tier] || config.basic;

  return (
    <Badge className={cn("text-white font-semibold shadow-lg", c.color, className)}>
      <span className="mr-1">{c.icon}</span>
      {c.label}
    </Badge>
  );
};
