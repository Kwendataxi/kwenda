import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TouchOptimizedInterfaceProps {
  children: React.ReactNode;
  className?: string;
  enableSwipeGestures?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const TouchOptimizedInterface: React.FC<TouchOptimizedInterfaceProps> = ({
  children,
  className,
  enableSwipeGestures = false,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown
}) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeGestures || !touchStart) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd || !enableSwipeGestures) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Horizontal swipes take priority over vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }
  };

  // Add haptic feedback for mobile interactions
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (isMobile && 'vibrate' in navigator) {
      const vibrationPatterns = {
        light: 10,
        medium: 20,
        heavy: 50
      };
      navigator.vibrate(vibrationPatterns[type]);
    }
  };

  // Optimize touch targets for mobile
  const touchOptimizedStyles = isMobile ? {
    minHeight: '44px', // Apple's recommended minimum touch target
    minWidth: '44px',
    cursor: 'pointer'
  } : {};

  return (
    <div
      ref={containerRef}
      className={cn(
        'touch-pan-y',
        isMobile && 'select-none',
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      style={touchOptimizedStyles}
    >
      {children}
    </div>
  );
};

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  hapticFeedback = 'light'
}) => {
  const isMobile = useIsMobile();
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
    if (isMobile && 'vibrate' in navigator) {
      const vibrationPatterns = {
        light: 10,
        medium: 20,
        heavy: 50
      };
      navigator.vibrate(vibrationPatterns[hapticFeedback]);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (onClick && !disabled) {
      onClick();
    }
  };

  const sizeStyles = {
    sm: 'min-h-[40px] min-w-[40px] px-3 py-2 text-sm',
    md: 'min-h-[44px] min-w-[44px] px-4 py-2.5 text-base',
    lg: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg'
  };

  return (
    <Button
      variant={variant}
      disabled={disabled}
      className={cn(
        sizeStyles[size],
        'transition-all duration-150',
        isPressed && 'scale-95 opacity-90',
        isMobile && 'active:scale-95 active:opacity-90',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={!isMobile ? onClick : undefined}
    >
      {children}
    </Button>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  swipeThreshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  swipeThreshold = 100
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setSwipeOffset(Math.max(-swipeThreshold, Math.min(swipeThreshold, diff)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (Math.abs(swipeOffset) > swipeThreshold * 0.6) {
      if (swipeOffset > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (swipeOffset < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    setSwipeOffset(0);
  };

  return (
    <Card
      className={cn(
        'transition-transform duration-200',
        className
      )}
      style={{
        transform: `translateX(${swipeOffset}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </Card>
  );
};

export default TouchOptimizedInterface;