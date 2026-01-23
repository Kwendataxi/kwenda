import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Gift } from 'lucide-react';
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
  showCloseButton?: boolean;
}

export const ScratchTicket: React.FC<ScratchTicketProps> = ({
  card,
  onScratch,
  onReveal,
  onClose,
  showCloseButton = false
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

  const getStampType = (): StampType => {
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

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = 160;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Realistic silver metallic base with brushed effect
    const metalGradient = ctx.createLinearGradient(0, 0, width, height);
    metalGradient.addColorStop(0, '#A8ACB4');
    metalGradient.addColorStop(0.2, '#C4C8D0');
    metalGradient.addColorStop(0.4, '#D8DCE4');
    metalGradient.addColorStop(0.6, '#C8CCD4');
    metalGradient.addColorStop(0.8, '#B8BCC4');
    metalGradient.addColorStop(1, '#A0A4AC');
    
    ctx.fillStyle = metalGradient;
    ctx.fillRect(0, 0, width, height);

    // Brushed metal horizontal lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < height; y += 2) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 0.5);
      ctx.lineTo(width, y + Math.random() * 0.5);
      ctx.stroke();
    }

    // Light reflection on top
    const reflectionGradient = ctx.createLinearGradient(0, 0, 0, height);
    reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    reflectionGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    reflectionGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.02)');
    reflectionGradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(0, 0, width, height);

    // Fine noise texture for realism
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const opacity = Math.random() * 0.04;
      ctx.fillStyle = Math.random() > 0.5 
        ? `rgba(255, 255, 255, ${opacity})` 
        : `rgba(0, 0, 0, ${opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // "GRATTEZ ICI" text with coin icons
    ctx.save();
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(80, 80, 90, 0.5)';
    ctx.fillText('GRATTEZ ICI', width / 2, height / 2);
    
    // Sparkle icons
    ctx.font = '18px system-ui';
    ctx.fillStyle = 'rgba(80, 80, 90, 0.4)';
    ctx.fillText('✨', width / 2 - 70, height / 2);
    ctx.fillText('✨', width / 2 + 70, height / 2);
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
      gradient.addColorStop(0.75, 'rgba(0,0,0,0.95)');
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
          setTimeout(() => setShowStamp(true), 200);
        }

        animationFrame.current = undefined;
      });
    }
  }, [isRevealed, onScratch, onReveal]);

  const triggerCelebration = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#22C55E', '#3B82F6', '#A855F7', '#F59E0B'],
      gravity: 0.9,
    });

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 80]);
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
    <div className="w-full">
      {/* Ticket Container - Realistic lottery ticket design */}
      <div className="bg-card rounded-xl border-2 border-dashed border-border shadow-lg overflow-hidden">
        
        {/* Header - Clean gradient with centered branding */}
        <div className="bg-gradient-to-r from-primary via-primary to-primary/95 px-4 py-3.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-primary-foreground/70">●</span>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary-foreground" />
              <span className="text-primary-foreground font-bold text-sm tracking-wider uppercase">
                Kwenda Gratta
              </span>
            </div>
            <span className="text-primary-foreground/70">●</span>
          </div>
        </div>

        {/* Separator line */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Ticket Info Row */}
        <div className="px-4 py-3 bg-muted/20 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">N° Ticket</div>
            <div className="font-mono font-bold text-sm text-foreground">{ticketNumber}</div>
          </div>
          
          {/* Card type badge */}
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-semibold",
            cardConfig?.colorClass === 'blue' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            cardConfig?.colorClass === 'yellow' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
            cardConfig?.colorClass === 'red' && 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
            !cardConfig?.colorClass && 'bg-muted text-muted-foreground'
          )}>
            {cardConfig?.emoji} {cardConfig?.labelFr}
          </div>
          
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</div>
            <div className="font-medium text-sm text-foreground">{today}</div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border/50" />

        {/* Scratch Zone */}
        <div className="p-4 bg-gradient-to-b from-background to-muted/10">
          <div 
            ref={containerRef}
            className="relative rounded-xl overflow-hidden border border-border shadow-inner bg-muted/20"
            style={{ minHeight: '160px' }}
          >
            {/* Prize content underneath */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary/5 via-primary/8 to-primary/5">
              <motion.div
                animate={isRevealed ? { 
                  scale: [0.5, 1.15, 1], 
                  rotate: [0, 10, -10, 0],
                } : { scale: 0.85, opacity: 0.25 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-4xl mb-2">{rewardConfig?.icon}</div>
              </motion.div>
              
              <motion.div
                animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0.15, y: 8 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="text-center"
              >
                <div className="text-2xl font-black text-primary">
                  {card.value.toLocaleString()} {card.currency}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {rewardConfig?.label}
                </div>
              </motion.div>

              {/* Stamp animation */}
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

          {/* Progress indicator */}
          {!isRevealed && (
            <div className="mt-4">
              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                <span className="text-sm">👆</span>
                Grattez la zone argentée pour révéler
              </p>
            </div>
          )}

          {/* Claim button */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: 'spring', damping: 20 }}
                className="mt-4"
              >
                <Button
                  onClick={onClose}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-base"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Réclamer mon gain
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Subtle info */}
        <div className="px-4 py-2.5 bg-muted/30 border-t border-dashed border-border/50">
          <p className="text-center text-[10px] text-muted-foreground">
            Valable 24h • Crédité automatiquement sur votre wallet KwendaPay
          </p>
        </div>
      </div>
    </div>
  );
};
