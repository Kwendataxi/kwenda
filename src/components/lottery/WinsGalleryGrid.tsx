import React from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScratchCardGridItem } from './scratch/ScratchCardGridItem';

interface Win {
  id: string;
  prize_value: number;
  currency: string;
  reward_type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  scratch_revealed_at: string | null;
  scratch_percentage: number;
  created_at: string;
  expires_in_hours?: number;
  prize_details?: { name?: string };
  is_partner_prize?: boolean;
  partner_prize?: {
    name: string;
    partner_name: string;
    image_url?: string;
  };
}

interface WinsGalleryGridProps {
  wins: Win[];
  className?: string;
  onScratch?: (cardId: string, percentage: number) => void;
  onReveal?: (cardId: string) => void;
}

export const WinsGalleryGrid: React.FC<WinsGalleryGridProps> = ({
  wins,
  className,
  onScratch = () => {},
  onReveal = () => {}
}) => {
  // Seulement les cartes révélées (plus de section "À gratter")
  const revealed = wins.filter(w => w.scratch_revealed_at || w.scratch_percentage >= 50);

  if (revealed.length === 0) {
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
    <div className={cn("px-4 space-y-6", className)}>
      {/* Section: Gains récents uniquement */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Vos gains récents
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {revealed.slice(0, 6).map((card) => (
            <ScratchCardGridItem
              key={card.id}
              card={card}
              onScratch={onScratch}
              onReveal={onReveal}
            />
          ))}
        </div>
        
        {revealed.length > 6 && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full mt-4 py-2.5 text-sm text-muted-foreground font-medium rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            Voir tout ({revealed.length})
          </motion.button>
        )}
      </div>
    </div>
  );
};
