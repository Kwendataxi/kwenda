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
        "transition-all duration-500 ease-out",
        className
      )}
      style={{ 
        animationFillMode: 'forwards',
        animationDelay: '100ms'
      }}
    >
      {children}
    </div>
  );
};