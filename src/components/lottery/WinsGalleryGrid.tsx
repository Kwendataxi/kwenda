import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Win {
  id: string;
  prize_value: number;
  currency: string;
  reward_type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  scratch_revealed_at: string | null;
  created_at: string;
  prize_details?: {
    name?: string;
  };
}

interface WinsGalleryGridProps {
  wins: Win[];
  className?: string;
}

const getRarityStyles = (rarity: Win['rarity']) => {
  switch (rarity) {
    case 'legendary':
      return {
        gradient: 'from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-500/30',
        icon: 'text-yellow-500',
        badge: 'bg-yellow-500/20 text-yellow-600'
      };
    case 'epic':
      return {
        gradient: 'from-purple-500/20 to-violet-500/20',
        border: 'border-purple-500/30',
        icon: 'text-purple-500',
        badge: 'bg-purple-500/20 text-purple-600'
      };
    case 'rare':
      return {
        gradient: 'from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-500/30',
        icon: 'text-blue-500',
        badge: 'bg-blue-500/20 text-blue-600'
      };
    default:
      return {
        gradient: 'from-muted/50 to-muted/30',
        border: 'border-border',
        icon: 'text-muted-foreground',
        badge: 'bg-primary/10 text-primary'
      };
  }
};

const getRewardIcon = (rewardType: string) => {
  switch (rewardType) {
    case 'xp_points':
      return <Star className="h-6 w-6" />;
    case 'boost_2x':
    case 'boost_3x':
      return <Sparkles className="h-6 w-6" />;
    case 'physical_gift':
    case 'internal_credit':
      return <Gift className="h-6 w-6" />;
    default:
      return <Gift className="h-6 w-6" />;
  }
};

const WinCard: React.FC<{ win: Win; index: number }> = ({ win, index }) => {
  const styles = getRarityStyles(win.rarity);
  const isRevealed = !!win.scratch_revealed_at;
  
  const formattedDate = win.scratch_revealed_at 
    ? format(new Date(win.scratch_revealed_at), "'gagné le' d MMMM", { locale: fr })
    : format(new Date(win.created_at), "'le' d MMMM", { locale: fr });

  const formatValue = (value: number, currency: string) => {
    if (currency === 'XP') return `+${value} XP`;
    return `${value.toLocaleString('fr-CD')} ${currency}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br",
        styles.gradient,
        "border",
        styles.border,
        "p-4"
      )}
    >
      {/* Gift icon */}
      <div className={cn(
        "w-12 h-12 rounded-full bg-background/80 flex items-center justify-center mb-3",
        styles.icon
      )}>
        {getRewardIcon(win.reward_type)}
      </div>

      {/* Won badge */}
      {isRevealed && (
        <div className={cn(
          "absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          styles.badge
        )}>
          <Check className="h-3 w-3" />
          Gagné
        </div>
      )}

      {/* Prize value */}
      <p className="text-lg font-bold text-foreground">
        {win.prize_details?.name || formatValue(win.prize_value, win.currency)}
      </p>

      {/* Date */}
      <p className="text-xs text-muted-foreground mt-1">
        {formattedDate}
      </p>

      {/* Decorative sparkle for legendary */}
      {win.rarity === 'legendary' && (
        <motion.div
          animate={{ 
            rotate: 360,
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </motion.div>
      )}
    </motion.div>
  );
};

export const WinsGalleryGrid: React.FC<WinsGalleryGridProps> = ({
  wins,
  className
}) => {
  if (wins.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <motion.div
          animate={{ 
            y: [0, -5, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-4xl mb-3"
        >
          🎁
        </motion.div>
        <p className="text-muted-foreground text-sm">
          Vos gains apparaîtront ici
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Continuez à utiliser l'app pour débloquer des cartes
        </p>
      </div>
    );
  }

  return (
    <div className={cn("px-4", className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        Vos gains récents
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {wins.slice(0, 6).map((win, index) => (
          <WinCard key={win.id} win={win} index={index} />
        ))}
      </div>

      {wins.length > 6 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-4 py-2.5 text-sm text-primary font-medium rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          Voir tous les gains ({wins.length})
        </motion.button>
      )}
    </div>
  );
};
