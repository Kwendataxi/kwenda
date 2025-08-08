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
        "animate-duration-300 animate-ease-out",
        className
      )}
      style={{ 
        animationFillMode: 'forwards',
        animationDelay: '50ms'
      }}
    >
      {children}
    </div>
  );
};