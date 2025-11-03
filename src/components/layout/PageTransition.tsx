import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <div 
      className={cn(
        "animate-fade-in opacity-0",
        "transition-all duration-300 ease-out",
        className
      )}
      style={{ 
        animationFillMode: 'forwards',
        willChange: 'opacity, transform',
        transform: 'translateZ(0)'
      }}
    >
      {children}
    </div>
  );
};