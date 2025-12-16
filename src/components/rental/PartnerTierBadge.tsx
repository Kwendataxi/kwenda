import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PartnerTierBadgeProps {
  tier: string;
  className?: string;
}

export const PartnerTierBadge = ({ tier, className }: PartnerTierBadgeProps) => {
  const config: Record<string, { icon: string; gradient: string; label: string; glow: string }> = {
    basic: { 
      icon: '🚗', 
      gradient: 'bg-gradient-to-r from-slate-500 to-slate-600', 
      label: 'Starter',
      glow: 'shadow-slate-500/30'
    },
    silver: { 
      icon: '🥈', 
      gradient: 'bg-gradient-to-r from-slate-400 via-gray-300 to-slate-500', 
      label: 'Pro',
      glow: 'shadow-slate-400/30'
    },
    gold: { 
      icon: '🥇', 
      gradient: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500', 
      label: 'Business',
      glow: 'shadow-amber-500/40'
    },
    platinum: { 
      icon: '💎', 
      gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600', 
      label: 'Enterprise',
      glow: 'shadow-purple-500/40'
    }
  };

  const c = config[tier] || config.basic;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Badge 
        className={cn(
          "text-white font-semibold shadow-lg relative overflow-hidden border-0",
          c.gradient,
          c.glow,
          className
        )}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        
        <span className="relative flex items-center gap-1.5">
          <motion.span
            animate={tier === 'gold' || tier === 'platinum' ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          >
            {c.icon}
          </motion.span>
          {c.label}
        </span>
      </Badge>
    </motion.div>
  );
};
