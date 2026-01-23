import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, Sparkles, Check, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, differenceInHours, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';

interface ScratchCardGridItemProps {
  card: {
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
  };
  onScratch: (cardId: string, percentage: number) => void;
  onReveal: (cardId: string) => void;
}

const getRarityStyle = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return { bg: 'bg-gradient-to-br from-amber-50 to-yellow-100', border: 'border-amber-200', accent: 'text-amber-600' };
    case 'epic':
      return { bg: 'bg-gradient-to-br from-violet-50 to-purple-100', border: 'border-violet-200', accent: 'text-violet-600' };
    case 'rare':
      return { bg: 'bg-gradient-to-br from-blue-50 to-cyan-100', border: 'border-blue-200', accent: 'text-blue-600' };
    default:
      return { bg: 'bg-gradient-to-br from-slate-50 to-gray-100', border: 'border-slate-200', accent: 'text-slate-600' };
  }
};

const getRewardIcon = (rewardType: string) => {
  switch (rewardType) {
    case 'xp_points': return <Star className="h-5 w-5" />;
    case 'boost_2x':
    case 'boost_3x': return <Sparkles className="h-5 w-5" />;
    case 'physical_gift': return <Gift className="h-5 w-5" />;
    case 'nothing': return <X className="h-5 w-5" />;
    default: return <Gift className="h-5 w-5" />;
  }
};

const getTimeRemaining = (createdAt: string, expiresInHours: number = 24) => {
  const expiresAt = addHours(new Date(createdAt), expiresInHours);
  const now = new Date();
  
  if (now >= expiresAt) return { expired: true, text: 'Expiré' };
  
  const hoursLeft = differenceInHours(expiresAt, now);
  const daysLeft = differenceInDays(expiresAt, now);
  
  if (daysLeft > 0) return { expired: false, text: `${daysLeft}j restants` };
  if (hoursLeft > 0) return { expired: false, text: `${hoursLeft}h restantes` };
  return { expired: false, text: 'Dernière chance!' };
};

export const ScratchCardGridItem: React.FC<ScratchCardGridItemProps> = ({
  card,
  onScratch,
  onReveal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [percentage, setPercentage] = useState(card.scratch_percentage || 0);
  const [isRevealed, setIsRevealed] = useState(!!card.scratch_revealed_at || percentage >= 50);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);

  const isAlreadyRevealed = !!card.scratch_revealed_at;
  const timeInfo = getTimeRemaining(card.created_at, card.expires_in_hours);
  const style = getRarityStyle(card.rarity);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || isAlreadyRevealed || isRevealed) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Soft silver metallic
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#C8CCD4');
    gradient.addColorStop(0.5, '#D8DCE4');
    gradient.addColorStop(1, '#C8CCD4');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Subtle texture
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // "GRATTEZ" text
    ctx.font = '500 10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(100,100,110,0.5)';
    ctx.fillText('GRATTEZ', rect.width / 2, rect.height / 2);
  }, [isAlreadyRevealed, isRevealed]);

  const scratchAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    
    const gradient = ctx.createRadialGradient(canvasX, canvasY, 0, canvasX, canvasY, 18);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.8, 'rgba(0,0,0,0.9)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 18, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    lastPosition.current = { x: canvasX, y: canvasY };

    // Calculate percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 64) {
      if (imageData.data[i] === 0) transparent++;
    }
    
    const newPercentage = (transparent / (imageData.data.length / 256)) * 100;
    setPercentage(newPercentage);
    onScratch(card.id, newPercentage);

    if (newPercentage >= 45 && !isRevealed) {
      setIsRevealed(true);
      onReveal(card.id);
      
      // Mini celebration
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#22C55E', '#3B82F6', '#A855F7'],
        gravity: 1.2,
      });

      if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    }
  }, [isRevealed, card.id, onScratch, onReveal]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAlreadyRevealed || timeInfo.expired) return;
    e.preventDefault();
    setIsScratching(true);
    const touch = e.touches[0];
    scratchAt(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScratching || isAlreadyRevealed) return;
    e.preventDefault();
    const touch = e.touches[0];
    scratchAt(touch.clientX, touch.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAlreadyRevealed || timeInfo.expired) return;
    setIsScratching(true);
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching || isAlreadyRevealed) return;
    scratchAt(e.clientX, e.clientY);
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPosition.current = null;
  };

  const formatValue = (value: number, currency: string) => {
    if (currency === 'XP') return `+${value} XP`;
    return `${value.toLocaleString('fr-CD')} ${currency}`;
  };

  const displayValue = card.reward_type === 'nothing' 
    ? 'Dommage !' 
    : card.prize_details?.name || formatValue(card.prize_value, card.currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "relative rounded-2xl border overflow-hidden shadow-sm",
        style.bg,
        style.border,
        timeInfo.expired && "opacity-60"
      )}
    >
      {/* Status badge */}
      <div className="absolute top-2 right-2 z-20">
        {isAlreadyRevealed ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
            <Check className="h-2.5 w-2.5" />
            Gagné
          </div>
        ) : timeInfo.expired ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-medium">
            Expiré
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">
            <Clock className="h-2.5 w-2.5" />
            {timeInfo.text}
          </div>
        )}
      </div>

      {/* Icon */}
      <div className="absolute top-2 left-2 z-20">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          card.reward_type === 'nothing' ? 'bg-gray-200 text-gray-500' : `${style.bg} ${style.accent}`
        )}>
          {getRewardIcon(card.reward_type)}
        </div>
      </div>

      {/* Main scratch area */}
      <div 
        ref={containerRef}
        className="relative aspect-[4/3] mt-10"
      >
        {/* Prize content underneath */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
          <motion.div
            animate={isRevealed || isAlreadyRevealed ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.2 }}
            className="text-center"
          >
            <div className="text-2xl mb-1">
              {card.reward_type === 'nothing' ? '😔' : '🎉'}
            </div>
            <p className={cn(
              "font-bold text-sm",
              card.reward_type === 'nothing' ? 'text-gray-500' : style.accent
            )}>
              {displayValue}
            </p>
            {card.is_partner_prize && card.partner_prize && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {card.partner_prize.partner_name}
              </p>
            )}
          </motion.div>
        </div>

        {/* Scratch canvas */}
        <AnimatePresence>
          {!isRevealed && !isAlreadyRevealed && !timeInfo.expired && (
            <motion.canvas
              ref={canvasRef}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full touch-none cursor-grab active:cursor-grabbing z-10"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleEnd}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground text-center">
          {isAlreadyRevealed 
            ? `Gagné le ${format(new Date(card.scratch_revealed_at!), 'd MMM', { locale: fr })}`
            : 'Grattez pour découvrir'
          }
        </p>
      </div>
    </motion.div>
  );
};
