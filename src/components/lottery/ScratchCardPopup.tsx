import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KwendaGrattaWin, CARD_TYPE_CONFIG, REWARD_CONFIG } from '@/types/kwenda-gratta';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface ScratchCardPopupProps {
  card: KwendaGrattaWin | null;
  isOpen: boolean;
  onClose: () => void;
  onScratch: (percentage: number) => void;
  onReveal: () => void;
}

export const ScratchCardPopup: React.FC<ScratchCardPopupProps> = ({
  card,
  isOpen,
  onClose,
  onScratch,
  onReveal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const totalPixels = useRef(0);
  const animationFrame = useRef<number>();

  const cardConfig = card ? CARD_TYPE_CONFIG[card.cardType] : null;
  const rewardConfig = card ? REWARD_CONFIG[card.rewardCategory] : null;

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || isRevealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = 300;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Silver gradient scratch surface
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#B8C4CE');
    gradient.addColorStop(0.3, '#D4DEE6');
    gradient.addColorStop(0.5, '#E8EEF2');
    gradient.addColorStop(0.7, '#D4DEE6');
    gradient.addColorStop(1, '#A8B4BE');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle texture
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 15 + 5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // "GRATTEZ ICI" text
    ctx.save();
    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ GRATTEZ ICI ✨', width / 2, height / 2);
    ctx.restore();

    totalPixels.current = width * height;
    setPercentage(0);
    lastPosition.current = null;
  }, [isOpen, isRevealed, card]);

  // Smooth scratch with interpolation
  const scratchAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    // Interpolate between last position and current for smooth scratching
    const positions: { x: number; y: number }[] = [];
    
    if (lastPosition.current) {
      const dx = canvasX - lastPosition.current.x;
      const dy = canvasY - lastPosition.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(dist / 8);
      
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

    // Scratch with large, soft brush
    ctx.globalCompositeOperation = 'destination-out';
    
    positions.forEach(pos => {
      // Main scratch circle
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 35);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Calculate percentage (throttled)
    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        
        for (let i = 3; i < imageData.data.length; i += 16) { // Sample every 4th pixel
          if (imageData.data[i] === 0) transparent++;
        }
        
        const newPercentage = (transparent / (totalPixels.current / 4)) * 100;
        setPercentage(newPercentage);
        onScratch(newPercentage);

        // Auto-reveal at 65%
        if (newPercentage >= 65 && !isRevealed) {
          setIsRevealed(true);
          onReveal();
          triggerCelebration();
        }

        animationFrame.current = undefined;
      });
    }
  }, [isRevealed, onScratch, onReveal]);

  // Celebration effects
  const triggerCelebration = () => {
    // Soft confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#007FFF', '#FFD700', '#EF4135'],
      gravity: 0.8,
      scalar: 0.9
    });

    // Play soft sound
    try {
      const audio = new Audio('/sounds/ching.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}

    // Light haptic
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  };

  // Event handlers
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

  const handleClose = () => {
    setIsRevealed(false);
    setPercentage(0);
    lastPosition.current = null;
    onClose();
  };

  if (!card) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={isRevealed ? handleClose : undefined}
          />

          {/* Card container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm"
          >
            {/* Close button (only after reveal) */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -top-12 right-0"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scratch card */}
            <div
              className={cn(
                'relative rounded-2xl overflow-hidden shadow-2xl',
                'bg-gradient-to-br',
                cardConfig?.colorClass === 'blue' && 'from-blue-600 to-blue-800',
                cardConfig?.colorClass === 'yellow' && 'from-amber-500 to-orange-600',
                cardConfig?.colorClass === 'red' && 'from-red-500 to-rose-700',
                cardConfig?.colorClass === 'gray' && 'from-slate-600 to-slate-800'
              )}
            >
              {/* Card type badge */}
              <div className="absolute top-3 left-3 z-20">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold flex items-center gap-1"
                >
                  <span>{cardConfig?.emoji}</span>
                  <span>{cardConfig?.labelFr}</span>
                </motion.div>
              </div>

              {/* Revealed content */}
              <div className="p-6 pt-14 pb-8">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm">
                  {/* Prize content (always visible underneath) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <motion.div
                      animate={isRevealed ? { scale: [0.8, 1.1, 1], rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="text-5xl mb-2">{rewardConfig?.icon}</div>
                    </motion.div>
                    
                    <motion.div
                      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 10 }}
                      className="text-center"
                    >
                      <div className="text-2xl font-bold text-white">
                        {card.value.toLocaleString()} {card.currency}
                      </div>
                      <div className="text-sm text-white/80 mt-1">
                        {rewardConfig?.label}
                      </div>
                    </motion.div>
                  </div>

                  {/* Scratch canvas overlay */}
                  <AnimatePresence>
                    {!isRevealed && (
                      <motion.canvas
                        ref={canvasRef}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          'absolute inset-0 w-full h-full touch-none',
                          'cursor-grab active:cursor-grabbing'
                        )}
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
                    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <motion.div
                        className="h-full bg-white/80 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-white/60 text-center mt-2">
                      {percentage < 65 ? '✨ Continue à gratter...' : 'Presque révélé !'}
                    </p>
                  </div>
                )}

                {/* Revealed CTA */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mt-4"
                    >
                      <Button
                        onClick={handleClose}
                        className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Réclamer mon bonus
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative sparkles */}
              {isRevealed && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: [0, (Math.random() - 0.5) * 100],
                        y: [0, (Math.random() - 0.5) * 100]
                      }}
                      transition={{ 
                        duration: 1.5,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="absolute"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`
                      }}
                    >
                      <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Instructions */}
            {!isRevealed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-white/60 text-sm mt-4"
              >
                👆 Glisse ton doigt pour gratter
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
