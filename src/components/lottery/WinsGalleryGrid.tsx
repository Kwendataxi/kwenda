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

const getRarityAccent = (rarity: Win['rarity']) => {
  switch (rarity) {
    case 'legendary':
      return 'bg-amber-50 border-amber-200 text-amber-600';
    case 'epic':
      return 'bg-violet-50 border-violet-200 text-violet-600';
    case 'rare':
      return 'bg-blue-50 border-blue-200 text-blue-600';
    default:
      return 'bg-slate-50 border-slate-200 text-slate-600';
  }
};

const getRewardIcon = (rewardType: string) => {
  switch (rewardType) {
    case 'xp_points':
      return <Star className="h-5 w-5" />;
    case 'boost_2x':
    case 'boost_3x':
      return <Sparkles className="h-5 w-5" />;
    default:
      return <Gift className="h-5 w-5" />;
  }
};

const WinCard: React.FC<{ win: Win; index: number }> = ({ win, index }) => {
  const accentClass = getRarityAccent(win.rarity);
  const isRevealed = !!win.scratch_revealed_at;
  
  const formattedDate = win.scratch_revealed_at 
    ? format(new Date(win.scratch_revealed_at), "'gagné le' d MMM", { locale: fr })
    : format(new Date(win.created_at), "'le' d MMM", { locale: fr });

  const formatValue = (value: number, currency: string) => {
    if (currency === 'XP') return `+${value} XP`;
    return `${value.toLocaleString('fr-CD')} ${currency}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl border border-border shadow-sm p-4 relative overflow-hidden"
    >
      {/* Icon circle */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mb-3",
        accentClass.split(' ').slice(0, 2).join(' ')
      )}>
        <span className={accentClass.split(' ').slice(2).join(' ')}>
          {getRewardIcon(win.reward_type)}
        </span>
      </div>

      {/* Won badge */}
      {isRevealed && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium">
          <Check className="h-2.5 w-2.5" />
          Gagné
        </div>
      )}

      {/* Prize value */}
      <p className="text-base font-semibold text-foreground">
        {win.prize_details?.name || formatValue(win.prize_value, win.currency)}
      </p>

      {/* Date */}
      <p className="text-[11px] text-muted-foreground mt-1">
        {formattedDate}
      </p>
    </motion.div>
  );
};

export const WinsGalleryGrid: React.FC<WinsGalleryGridProps> = ({
  wins,
  className
}) => {
  if (wins.length === 0) {
    return (
      <div className={cn("text-center py-10 px-4", className)}>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center"
        >
          <Gift className="h-6 w-6 text-muted-foreground" />
        </motion.div>
        <p className="text-muted-foreground text-sm font-medium">
          Vos gains apparaîtront ici
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Continuez pour débloquer des cartes
        </p>
      </div>
    );
  }

  return (
    <div className={cn("px-4", className)}>
      <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
        Vos gains récents
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {wins.slice(0, 6).map((win, index) => (
          <WinCard key={win.id} win={win} index={index} />
        ))}
      </div>

      {wins.length > 6 && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full mt-4 py-2.5 text-sm text-muted-foreground font-medium rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          Voir tout ({wins.length})
        </motion.button>
      )}
    </div>
  );
};
