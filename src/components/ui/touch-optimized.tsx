import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

interface TouchOptimizedButtonProps extends ButtonProps {
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  minTouchTarget?: boolean;
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  className,
  hapticFeedback = 'light',
  minTouchTarget = true,
  onClick,
  ...props
}) => {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[hapticFeedback]);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHaptic();
    onClick?.(e);
  };

  return (
    <Button
      className={cn(
        'touch-manipulation',
        minTouchTarget && 'min-touch-target',
        'active:scale-95 transition-transform duration-75',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};

interface TouchOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  pressScale?: number;
}

export const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  children,
  className,
  onTap,
  pressScale = 0.98
}) => {
  return (
    <div
      className={cn(
        'touch-manipulation cursor-pointer',
        'transition-transform duration-150 ease-out',
        'active:scale-[0.98] hover:scale-[1.02]',
        'min-touch-target',
        className
      )}
      onClick={onTap}
      style={{
        '--press-scale': pressScale
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const SwipeableContainer: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className
}) => {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setTouchStart(null);
  };

  return (
    <div
      className={cn('touch-manipulation', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export { TouchOptimizedButton as Button };
export default TouchOptimizedButton;