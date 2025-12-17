import React, { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  disabled?: boolean;
  className?: string;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export const PullToRefresh = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  disabled = false,
  className,
}: PullToRefreshProps) => {
  const [state, setState] = useState<RefreshState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useMotionValue(0);
  const { triggerHaptic } = useHapticFeedback();
  
  const opacity = useTransform(pullDistance, [0, refreshThreshold], [0, 1]);
  const scale = useTransform(pullDistance, [0, refreshThreshold], [0.5, 1]);
  const rotation = useTransform(pullDistance, [0, refreshThreshold * 2], [0, 360]);

  const getScrollTop = useCallback(() => {
    if (!containerRef.current) return 0;
    // Check if container itself is scrolled, or window
    const parent = containerRef.current.closest('[data-scroll-container]');
    if (parent) {
      return parent.scrollTop;
    }
    return window.scrollY || document.documentElement.scrollTop;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;
    
    const scrollTop = getScrollTop();
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    }
  }, [disabled, state, getScrollTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;
    
    const scrollTop = getScrollTop();
    if (scrollTop > 0) {
      pullDistance.set(0);
      setState('idle');
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, refreshThreshold * 1.5);
      pullDistance.set(distance);
      
      if (distance >= refreshThreshold && state !== 'ready') {
        setState('ready');
        triggerHaptic('medium');
      } else if (distance < refreshThreshold && distance > 0 && state !== 'pulling') {
        setState('pulling');
      }
    }
  }, [disabled, state, refreshThreshold, pullDistance, triggerHaptic, getScrollTop]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return;

    if (state === 'ready') {
      setState('refreshing');
      triggerHaptic('heavy');
      pullDistance.set(refreshThreshold * 0.6);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        pullDistance.set(0);
        setState('idle');
      }
    } else {
      pullDistance.set(0);
      setState('idle');
    }
    
    startY.current = 0;
    currentY.current = 0;
  }, [disabled, state, onRefresh, pullDistance, refreshThreshold, triggerHaptic]);

  const getStateText = () => {
    switch (state) {
      case 'pulling':
        return 'Tirer pour rafraîchir';
      case 'ready':
        return 'Relâcher pour rafraîchir';
      case 'refreshing':
        return 'Chargement...';
      default:
        return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: state === 'refreshing' ? 60 : pullDistance.get() 
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-orange-500/10 to-transparent"
          >
            <motion.div
              style={{ scale, opacity }}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                style={{ rotate: state === 'refreshing' ? undefined : rotation }}
                animate={state === 'refreshing' ? { rotate: 360 } : {}}
                transition={state === 'refreshing' ? { 
                  duration: 1, 
                  repeat: Infinity, 
                  ease: 'linear' 
                } : {}}
                className={cn(
                  'p-2 rounded-full',
                  state === 'ready' || state === 'refreshing'
                    ? 'bg-orange-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {state === 'refreshing' ? (
                  <RefreshCw className="h-5 w-5" />
                ) : state === 'ready' ? (
                  <RefreshCw className="h-5 w-5" />
                ) : (
                  <ArrowDown className="h-5 w-5" />
                )}
              </motion.div>
              <motion.span 
                className="text-xs font-medium text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {getStateText()}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        style={{ 
          y: state !== 'idle' ? pullDistance : 0 
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
