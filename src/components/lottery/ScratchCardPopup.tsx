import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, Diamond } from 'lucide-react';
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
  const shimmerPhase = useRef(0);

  const cardConfig = card ? CARD_TYPE_CONFIG[card.cardType] : null;
  const rewardConfig = card ? REWARD_CONFIG[card.rewardCategory] : null;

  // Premium high-resolution canvas with holographic effect
  useEffect(() => {
    if (!isOpen || !canvasRef.current || isRevealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // High-DPI support for 4K quality
    const dpr = window.devicePixelRatio || 1;
    const width = 400;
    const height = 240;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Premium holographic base gradient
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, '#1a1a2e');
    baseGradient.addColorStop(0.15, '#16213e');
    baseGradient.addColorStop(0.3, '#1a1a2e');
    baseGradient.addColorStop(0.5, '#0f3460');
    baseGradient.addColorStop(0.7, '#1a1a2e');
    baseGradient.addColorStop(0.85, '#16213e');
    baseGradient.addColorStop(1, '#1a1a2e');
    
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // Holographic rainbow shimmer layer
    const createHolographicLayer = () => {
      const hologramGradient = ctx.createLinearGradient(0, 0, width, height);
      hologramGradient.addColorStop(0, 'rgba(255, 0, 128, 0.15)');
      hologramGradient.addColorStop(0.2, 'rgba(0, 255, 255, 0.12)');
      hologramGradient.addColorStop(0.4, 'rgba(255, 255, 0, 0.1)');
      hologramGradient.addColorStop(0.6, 'rgba(0, 255, 128, 0.12)');
      hologramGradient.addColorStop(0.8, 'rgba(128, 0, 255, 0.15)');
      hologramGradient.addColorStop(1, 'rgba(255, 0, 128, 0.15)');
      ctx.fillStyle = hologramGradient;
      ctx.fillRect(0, 0, width, height);
    };
    createHolographicLayer();

    // Premium metallic gold overlay
    const goldGradient = ctx.createLinearGradient(0, 0, width * 0.7, height);
    goldGradient.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
    goldGradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.15)');
    goldGradient.addColorStop(0.5, 'rgba(255, 239, 184, 0.2)');
    goldGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.15)');
    goldGradient.addColorStop(1, 'rgba(212, 175, 55, 0.25)');
    ctx.fillStyle = goldGradient;
    ctx.fillRect(0, 0, width, height);

    // Add premium light streaks
    for (let i = 0; i < 12; i++) {
      const streakGradient = ctx.createLinearGradient(
        Math.random() * width, 0,
        Math.random() * width, height
      );
      streakGradient.addColorStop(0, 'transparent');
      streakGradient.addColorStop(0.4, `rgba(255, 255, 255, ${Math.random() * 0.08})`);
      streakGradient.addColorStop(0.6, `rgba(255, 255, 255, ${Math.random() * 0.12})`);
      streakGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = streakGradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Sparkle highlights for premium look
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 15 + 3;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const intensity = Math.random() * 0.25;
      gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
      gradient.addColorStop(0.5, `rgba(255, 223, 186, ${intensity * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Diamond star accents
    const drawDiamond = (x: number, y: number, size: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(-size/2, -size/2, size, size);
      ctx.restore();
    };

    for (let i = 0; i < 25; i++) {
      drawDiamond(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 4 + 2,
        Math.random() * 0.4
      );
    }

    // Premium "GRATTEZ ICI" text with glow effect
    ctx.save();
    ctx.font = 'bold 20px "SF Pro Display", system-ui, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Glow effect
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillText('✦ GRATTEZ ICI ✦', width / 2, height / 2);
    
    // Main text
    ctx.shadowBlur = 0;
    const textGradient = ctx.createLinearGradient(width/2 - 80, 0, width/2 + 80, 0);
    textGradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
    textGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    textGradient.addColorStop(1, 'rgba(255, 215, 0, 0.7)');
    ctx.fillStyle = textGradient;
    ctx.fillText('✦ GRATTEZ ICI ✦', width / 2, height / 2);
    ctx.restore();

    // Decorative corner diamonds
    const corners = [[20, 20], [width - 20, 20], [20, height - 20], [width - 20, height - 20]];
    corners.forEach(([x, y]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      const diamondGrad = ctx.createLinearGradient(-8, -8, 8, 8);
      diamondGrad.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
      diamondGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      diamondGrad.addColorStop(1, 'rgba(255, 215, 0, 0.6)');
      ctx.fillStyle = diamondGrad;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.restore();
    });

    // Premium inner border
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(12, 12, width - 24, height - 24);
    ctx.setLineDash([]);

    // Outer glow border
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    totalPixels.current = width * height;
    setPercentage(0);
    lastPosition.current = null;
  }, [isOpen, isRevealed, card]);

  // Smooth premium scratch with golden particles
  const scratchAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    const positions: { x: number; y: number }[] = [];
    
    if (lastPosition.current) {
      const dx = canvasX - lastPosition.current.x;
      const dy = canvasY - lastPosition.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(dist / 5);
      
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
      // Larger scratch radius for better UX
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 35);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.95)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(() => {
        const dpr = window.devicePixelRatio || 1;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        
        // Sample every 16th pixel for performance
        for (let i = 3; i < imageData.data.length; i += 64) {
          if (imageData.data[i] === 0) transparent++;
        }
        
        const adjustedTotal = totalPixels.current * dpr * dpr;
        const newPercentage = (transparent / (adjustedTotal / 16)) * 100;
        setPercentage(newPercentage);
        onScratch(newPercentage);

        if (newPercentage >= 55 && !isRevealed) {
          setIsRevealed(true);
          onReveal();
          triggerPremiumCelebration();
        }

        animationFrame.current = undefined;
      });
    }
  }, [isRevealed, onScratch, onReveal]);

  const triggerPremiumCelebration = () => {
    // Premium golden confetti burst
    const colors = ['#D4AF37', '#FFD700', '#FFC107', '#FFEB3B', '#F5E6C8', '#FFFFFF'];
    
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors,
      gravity: 0.7,
      scalar: 1.2,
      shapes: ['circle', 'square'],
    });

    // Side bursts with delay
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
    }, 150);

    // Top shower
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 180,
        startVelocity: 30,
        origin: { y: 0 },
        colors,
        gravity: 1.2,
      });
    }, 300);

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 100, 50, 150]);
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
          {/* Premium dark overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={isRevealed ? handleClose : undefined}
          />

          {/* Premium card container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40, rotateX: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-[440px]"
            style={{ perspective: '1000px' }}
          >
            {/* Animated glow effect around card */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 40px rgba(212, 175, 55, 0.3), 0 0 80px rgba(212, 175, 55, 0.1)',
                  '0 0 60px rgba(255, 215, 0, 0.4), 0 0 120px rgba(255, 215, 0, 0.15)',
                  '0 0 40px rgba(212, 175, 55, 0.3), 0 0 80px rgba(212, 175, 55, 0.1)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-3xl pointer-events-none"
            />

            {/* Close button (only after reveal) */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -top-14 right-0"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium Casino Card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
              {/* Animated gold border effect */}
              <motion.div 
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['200% 0', '-200% 0'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 rounded-3xl border-2 border-amber-500/50 pointer-events-none" />
              
              {/* Premium diamond pattern overlay */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0l16 16-16 16L0 16z' fill='%23FFD700' fill-opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '32px 32px'
                }}
              />

              {/* Premium Header */}
              <div className="relative px-6 pt-5 pb-4 border-b border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Diamond className="h-5 w-5 text-amber-400" />
                    </motion.div>
                    <span className="text-amber-100 text-base font-bold tracking-widest uppercase">
                      Kwenda Gratta
                    </span>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Diamond className="h-5 w-5 text-amber-400" />
                    </motion.div>
                  </div>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 0 0 rgba(255,215,0,0)',
                        '0 0 20px rgba(255,215,0,0.3)',
                        '0 0 0 rgba(255,215,0,0)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border",
                      cardConfig?.colorClass === 'blue' && 'bg-blue-500/20 text-blue-300 border-blue-400/30',
                      cardConfig?.colorClass === 'yellow' && 'bg-amber-500/20 text-amber-300 border-amber-400/30',
                      cardConfig?.colorClass === 'red' && 'bg-rose-500/20 text-rose-300 border-rose-400/30',
                      cardConfig?.colorClass === 'gray' && 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                    )}
                  >
                    {cardConfig?.emoji} {cardConfig?.labelFr}
                  </motion.div>
                </div>
              </div>

              {/* Premium Scratch area */}
              <div className="p-6">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-amber-500/40 shadow-[inset_0_2px_20px_rgba(0,0,0,0.3)]">
                  {/* Inner glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />
                  
                  {/* Prize content (always visible underneath) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5">
                    <motion.div
                      animate={isRevealed ? { 
                        scale: [0.6, 1.2, 1], 
                        rotate: [0, 15, -15, 0],
                      } : {}}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                      <div className="text-6xl mb-3 drop-shadow-2xl">{rewardConfig?.icon}</div>
                    </motion.div>
                    
                    <motion.div
                      animate={isRevealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.15, y: 10, scale: 0.95 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-center"
                    >
                      <motion.div 
                        className="text-4xl font-black text-amber-100 tracking-tight"
                        animate={isRevealed ? { 
                          textShadow: [
                            '0 0 20px rgba(255,215,0,0)',
                            '0 0 40px rgba(255,215,0,0.5)',
                            '0 0 20px rgba(255,215,0,0.3)',
                          ]
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {card.value.toLocaleString()} {card.currency}
                      </motion.div>
                      <div className="text-sm text-amber-200/80 mt-2 font-medium tracking-wide">
                        {rewardConfig?.label}
                      </div>
                    </motion.div>
                  </div>

                  {/* Premium Scratch canvas overlay */}
                  <AnimatePresence>
                    {!isRevealed && (
                      <motion.canvas
                        ref={canvasRef}
                        exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                        style={{ height: '240px' }}
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

                {/* Premium Progress indicator */}
                {!isRevealed && (
                  <div className="mt-5">
                    <div className="relative h-2 rounded-full bg-slate-700/50 overflow-hidden border border-slate-600/30">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full"
                        style={{ width: `${Math.min(percentage * 1.8, 100)}%` }}
                        transition={{ duration: 0.1 }}
                      />
                      {/* Shimmer effect on progress bar */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </motion.div>
                      <p className="text-sm text-slate-300 font-medium tracking-wide">
                        {percentage < 55 ? 'Grattez pour révéler votre prix...' : '🎉 Révélation imminente !'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Revealed CTA */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="mt-5"
                    >
                      <Button
                        onClick={handleClose}
                        className="w-full h-14 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 font-bold text-lg tracking-wide shadow-xl shadow-amber-500/30 rounded-xl border-2 border-amber-400/50"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Réclamer mon bonus
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Premium Footer decoration */}
              <div className="px-6 pb-5 pt-3 border-t border-amber-500/20">
                <div className="flex justify-center items-center gap-4">
                  {['♠', '♥', '♦', '♣'].map((symbol, i) => (
                    <motion.span
                      key={symbol}
                      className={cn(
                        "text-lg",
                        i === 1 || i === 2 ? 'text-amber-500/60' : 'text-amber-500/40'
                      )}
                      animate={{ 
                        y: [0, -3, 0],
                        opacity: [0.4, 0.8, 0.4]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    >
                      {symbol}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Decorative sparkles on reveal */}
              {isRevealed && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        x: [0, (Math.random() - 0.5) * 120],
                        y: [0, (Math.random() - 0.5) * 120]
                      }}
                      transition={{ 
                        duration: 1.5,
                        delay: i * 0.06,
                        repeat: Infinity,
                        repeatDelay: 0.5
                      }}
                      className="absolute pointer-events-none"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`
                      }}
                    >
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow-lg" />
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Premium Instructions */}
            {!isRevealed && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center text-white/60 text-sm mt-5 font-medium tracking-wide"
              >
                👆 Glissez votre doigt pour gratter
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
