import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KwendaGrattaWin, CARD_TYPE_CONFIG, REWARD_CONFIG } from '@/types/kwenda-gratta';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { StampReveal, StampType } from './StampReveal';

interface ScratchTicketProps {
  card: KwendaGrattaWin;
  onScratch: (percentage: number) => void;
  onReveal: () => void;
  onClose: () => void;
}

export const ScratchTicket: React.FC<ScratchTicketProps> = ({
  card,
  onScratch,
  onReveal,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const totalPixels = useRef(0);
  const animationFrame = useRef<number>();

  // Determine stamp type based on value
  const getStampType = (): StampType => {
    // Big wins = GAGNÉ, small wins/boosts = BONUS
    if (card.value >= 100 || card.rewardCategory === 'free_delivery') {
      return 'win';
    }
    return 'bonus';
  };

  const cardConfig = CARD_TYPE_CONFIG[card.cardType];
  const rewardConfig = REWARD_CONFIG[card.rewardCategory];

  const ticketNumber = `KG-${card.id.slice(0, 8).toUpperCase()}`;
  const today = new Date().toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  // Initialize realistic metallic scratch surface
  useEffect(() => {
    if (!canvasRef.current || isRevealed) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Get actual container size for responsive canvas
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = 160;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Realistic silver metallic base
    const metalGradient = ctx.createLinearGradient(0, 0, width, height);
    metalGradient.addColorStop(0, '#8E9196');
    metalGradient.addColorStop(0.15, '#A8ADB3');
    metalGradient.addColorStop(0.3, '#9FA3A9');
    metalGradient.addColorStop(0.5, '#B8BCC2');
    metalGradient.addColorStop(0.7, '#9FA3A9');
    metalGradient.addColorStop(0.85, '#A8ADB3');
    metalGradient.addColorStop(1, '#8E9196');
    
    ctx.fillStyle = metalGradient;
    ctx.fillRect(0, 0, width, height);

    // Add vertical metallic sheen
    const sheenGradient = ctx.createLinearGradient(0, 0, 0, height);
    sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    sheenGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    sheenGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
    sheenGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
    sheenGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = sheenGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle noise texture for realism
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const opacity = Math.random() * 0.08;
      ctx.fillStyle = Math.random() > 0.5 
        ? `rgba(255, 255, 255, ${opacity})` 
        : `rgba(0, 0, 0, ${opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Horizontal light reflections
    for (let i = 0; i < 6; i++) {
      const y = (height / 6) * i + Math.random() * 20;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.04})`;
      ctx.fillRect(0, y, width, 2);
    }

    // "GRATTEZ ICI" text
    ctx.save();
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText('GRATTEZ ICI', width / 2 + 1, height / 2 + 1);
    
    // Main text
    ctx.fillStyle = 'rgba(80, 80, 80, 0.7)';
    ctx.fillText('GRATTEZ ICI', width / 2, height / 2);
    
    // Coin icon hint
    ctx.font = '24px system-ui';
    ctx.fillText('🪙', width / 2 - 70, height / 2);
    ctx.fillText('🪙', width / 2 + 70, height / 2);
    ctx.restore();

    totalPixels.current = width * height;
    setPercentage(0);
    lastPosition.current = null;
  }, [isRevealed, card]);

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

    const positions: { x: number; y: number }[] = [];
    
    if (lastPosition.current) {
      const dx = canvasX - lastPosition.current.x;
      const dy = canvasY - lastPosition.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(dist / 4);
      
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        positions.push({
          x: lastPosition.current.x + dx * t,
          y: lastPosition.current.y + dy * t
        });
      }
    } else {
      positions.push({ x: canvasX, y: canvasY });
    }

    lastPosition.current = { x: canvasX, y: canvasY };

    ctx.globalCompositeOperation = 'destination-out';
    
    positions.forEach(pos => {
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 28);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.8, 'rgba(0,0,0,0.9)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(() => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        
        for (let i = 3; i < imageData.data.length; i += 64) {
          if (imageData.data[i] === 0) transparent++;
        }
        
        const adjustedTotal = totalPixels.current * dpr * dpr;
        const newPercentage = (transparent / (adjustedTotal / 16)) * 100;
        setPercentage(newPercentage);
        onScratch(newPercentage);

        if (newPercentage >= 50 && !isRevealed) {
          setIsRevealed(true);
          onReveal();
          triggerCelebration();
          // Show stamp with slight delay for dramatic effect
          setTimeout(() => setShowStamp(true), 200);
        }

        animationFrame.current = undefined;
      });
    }
  }, [isRevealed, onScratch, onReveal]);

  const triggerCelebration = () => {
    const colors = ['#F97316', '#FBBF24', '#22C55E', '#3B82F6', '#A855F7'];
    
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      gravity: 0.8,
    });

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 100]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScratching(true);
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching) return;
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
    lastPosition.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const touch = e.touches[0];
    scratchAt(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isScratching) return;
    const touch = e.touches[0];
    scratchAt(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
    lastPosition.current = null;
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Ticket Container */}
      <div className="relative">
        {/* Perforated edge effect - top */}
        <div className="absolute -top-1 left-4 right-4 flex justify-between">
          {[...Array(20)].map((_, i) => (
            <div 
              key={`top-${i}`} 
              className="w-2 h-2 rounded-full bg-background" 
            />
          ))}
        </div>

        {/* Main ticket body */}
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-xl border border-amber-200/50 dark:border-amber-500/20">
          
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary-foreground" />
                <span className="text-primary-foreground font-bold text-lg tracking-wide">
                  KWENDA GRATTA
                </span>
              </div>
              <div className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                cardConfig?.colorClass === 'blue' && 'bg-blue-500 text-white',
                cardConfig?.colorClass === 'yellow' && 'bg-amber-500 text-white',
                cardConfig?.colorClass === 'red' && 'bg-rose-500 text-white',
                cardConfig?.colorClass === 'gray' && 'bg-slate-500 text-white'
              )}>
                {cardConfig?.emoji} {cardConfig?.labelFr}
              </div>
            </div>
          </div>

          {/* Ticket Info Block */}
          <div className="px-4 py-3 border-b border-dashed border-amber-300/50 dark:border-amber-500/30 flex justify-between items-center text-xs">
            <div className="space-y-0.5">
              <div className="text-muted-foreground">N° Ticket</div>
              <div className="font-mono font-bold text-foreground">{ticketNumber}</div>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-muted-foreground">Date</div>
              <div className="font-medium text-foreground">{today}</div>
            </div>
          </div>

          {/* Scratch Zone */}
          <div className="p-4">
            <div 
              ref={containerRef}
              className="relative rounded-xl overflow-hidden border-2 border-dashed border-amber-400/50 dark:border-amber-500/40"
              style={{ minHeight: '160px' }}
            >
              {/* Prize content underneath */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-emerald-900/30 dark:to-green-900/20">
                <motion.div
                  animate={isRevealed ? { 
                    scale: [0.5, 1.1, 1], 
                    rotate: [0, 10, -10, 0],
                  } : { scale: 0.9, opacity: 0.3 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-5xl mb-2">{rewardConfig?.icon}</div>
                </motion.div>
                
                <motion.div
                  animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 5 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="text-center"
                >
                  <div className="text-2xl font-black text-green-700 dark:text-green-400">
                    {card.value.toLocaleString()} {card.currency}
                  </div>
                  <div className="text-sm text-green-600/80 dark:text-green-500/80 mt-1 font-medium">
                    {rewardConfig?.label}
                  </div>
                </motion.div>

                {/* Stamp animation on reveal */}
                <AnimatePresence>
                  {isRevealed && showStamp && (
                    <StampReveal
                      type={getStampType()}
                      value={card.value}
                      currency={card.currency}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Scratch canvas overlay */}
              <AnimatePresence>
                {!isRevealed && (
                  <motion.canvas
                    ref={canvasRef}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full touch-none cursor-grab active:cursor-grabbing"
                    style={{ height: '160px' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            {!isRevealed && (
              <div className="mt-4">
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                  <span className="inline-block animate-pulse">👆</span>
                  Grattez la zone argentée
                </p>
              </div>
            )}

            {/* Claim button on reveal */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                  className="mt-4"
                >
                  <Button
                    onClick={onClose}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Réclamer mon gain
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ticket Footer */}
          <div className="px-4 py-2.5 bg-amber-100/50 dark:bg-amber-900/20 border-t border-amber-200/50 dark:border-amber-500/20">
            <p className="text-center text-[10px] text-muted-foreground">
              Valable 24h • Crédité automatiquement sur votre wallet
            </p>
          </div>
        </div>

        {/* Perforated edge effect - bottom */}
        <div className="absolute -bottom-1 left-4 right-4 flex justify-between">
          {[...Array(20)].map((_, i) => (
            <div 
              key={`bottom-${i}`} 
              className="w-2 h-2 rounded-full bg-background" 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
