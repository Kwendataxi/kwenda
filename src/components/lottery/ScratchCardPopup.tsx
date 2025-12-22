import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star } from 'lucide-react';
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

  // Initialize canvas with luxurious metallic texture
  useEffect(() => {
    if (!isOpen || !canvasRef.current || isRevealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = 280;
    const height = 180;
    canvas.width = width;
    canvas.height = height;

    // Base metallic gradient - silver/gold
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, '#C0C0C0');
    baseGradient.addColorStop(0.2, '#E8E8E8');
    baseGradient.addColorStop(0.4, '#D4AF37');
    baseGradient.addColorStop(0.6, '#F5E6C8');
    baseGradient.addColorStop(0.8, '#E8E8E8');
    baseGradient.addColorStop(1, '#C0C0C0');
    
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // Add metallic shimmer highlights
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 20 + 5;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${Math.random() * 0.3})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    // Add subtle noise texture
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random() * 0.03})`;
      ctx.fillRect(
        Math.random() * width,
        Math.random() * height,
        1,
        1
      );
    }

    // "GRATTEZ ICI" text with casino style
    ctx.save();
    ctx.font = 'bold 16px system-ui';
    ctx.fillStyle = 'rgba(50, 50, 50, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♦ GRATTEZ ICI ♦', width / 2, height / 2);
    ctx.restore();

    // Add border highlight
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);

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

    const positions: { x: number; y: number }[] = [];
    
    if (lastPosition.current) {
      const dx = canvasX - lastPosition.current.x;
      const dy = canvasY - lastPosition.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(dist / 6);
      
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
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 30);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.6, 'rgba(0,0,0,0.9)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        
        for (let i = 3; i < imageData.data.length; i += 16) {
          if (imageData.data[i] === 0) transparent++;
        }
        
        const newPercentage = (transparent / (totalPixels.current / 4)) * 100;
        setPercentage(newPercentage);
        onScratch(newPercentage);

        if (newPercentage >= 65 && !isRevealed) {
          setIsRevealed(true);
          onReveal();
          triggerCelebration();
        }

        animationFrame.current = undefined;
      });
    }
  }, [isRevealed, onScratch, onReveal]);

  const triggerCelebration = () => {
    // Golden confetti
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#FFD700', '#FFC107', '#FFEB3B', '#F5E6C8'],
      gravity: 0.8,
      scalar: 1.1
    });

    // Second burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.3 },
        colors: ['#D4AF37', '#FFD700', '#FFFFFF'],
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.7 },
        colors: ['#D4AF37', '#FFD700', '#FFFFFF'],
      });
    }, 200);

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 100]);
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
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={isRevealed ? handleClose : undefined}
          />

          {/* Card container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="relative z-10 w-full max-w-[340px]"
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

            {/* Casino Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
              {/* Gold border effect */}
              <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/40 pointer-events-none" />
              
              {/* Diamond pattern overlay */}
              <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 0l12 12-12 12L0 12z' fill='%23D4AF37' fill-opacity='0.5'/%3E%3C/svg%3E")`,
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Header with card type */}
              <div className="relative px-5 pt-4 pb-3 border-b border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">♦</span>
                    <span className="text-amber-100 text-sm font-semibold tracking-wide">
                      KWENDA GRATTA
                    </span>
                    <span className="text-amber-400 text-sm">♦</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      cardConfig?.colorClass === 'blue' && 'bg-blue-500/20 text-blue-300',
                      cardConfig?.colorClass === 'yellow' && 'bg-amber-500/20 text-amber-300',
                      cardConfig?.colorClass === 'red' && 'bg-rose-500/20 text-rose-300',
                      cardConfig?.colorClass === 'gray' && 'bg-slate-500/20 text-slate-300'
                    )}
                  >
                    {cardConfig?.emoji} {cardConfig?.labelFr}
                  </motion.div>
                </div>
              </div>

              {/* Scratch area */}
              <div className="p-5">
                <div className="relative aspect-[14/9] rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border border-amber-500/30 shadow-inner">
                  {/* Prize content (always visible underneath) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-500/10 to-transparent">
                    <motion.div
                      animate={isRevealed ? { scale: [0.8, 1.15, 1], rotate: [0, 8, -8, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-5xl mb-2">{rewardConfig?.icon}</div>
                    </motion.div>
                    
                    <motion.div
                      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 8 }}
                      className="text-center"
                    >
                      <div className="text-2xl font-bold text-amber-100">
                        {card.value.toLocaleString()} {card.currency}
                      </div>
                      <div className="text-sm text-amber-200/70 mt-1">
                        {rewardConfig?.label}
                      </div>
                    </motion.div>
                  </div>

                  {/* Scratch canvas overlay */}
                  <AnimatePresence>
                    {!isRevealed && (
                      <motion.canvas
                        ref={canvasRef}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
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
                    <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      {percentage < 65 ? '✨ Grattez pour révéler...' : '🎉 Presque là !'}
                    </p>
                  </div>
                )}

                {/* Revealed CTA */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="mt-4"
                    >
                      <Button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold shadow-lg shadow-amber-500/30"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Réclamer mon bonus
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer decoration */}
              <div className="px-5 pb-4 pt-2 border-t border-amber-500/20 flex justify-center gap-3 text-amber-500/30">
                <span>♠</span>
                <span>♥</span>
                <span>♦</span>
                <span>♣</span>
              </div>

              {/* Decorative sparkles on reveal */}
              {isRevealed && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: [0, (Math.random() - 0.5) * 80],
                        y: [0, (Math.random() - 0.5) * 80]
                      }}
                      transition={{ 
                        duration: 1.2,
                        delay: i * 0.08,
                        repeat: Infinity,
                        repeatDelay: 0.8
                      }}
                      className="absolute pointer-events-none"
                      style={{
                        top: `${25 + Math.random() * 50}%`,
                        left: `${15 + Math.random() * 70}%`
                      }}
                    >
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
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
                transition={{ delay: 0.4 }}
                className="text-center text-white/50 text-sm mt-4"
              >
                👆 Glisse pour gratter
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
