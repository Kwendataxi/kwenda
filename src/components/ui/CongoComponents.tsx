import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Congo Button Component
interface CongoButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const CongoButton: React.FC<CongoButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) => {
  const variants = {
    default: 'bg-congo-red hover:bg-congo-red/90 text-white shadow-congo',
    electric: 'congo-gradient-electric text-white shadow-congo-intense',
    vibrant: 'congo-gradient-vibrant text-white shadow-congo-vibrant',
    glow: 'bg-congo-blue hover:bg-congo-blue/90 text-white shadow-congo-glow',
    success: 'bg-congo-green hover:bg-congo-green/90 text-white shadow-elegant',
    warning: 'bg-congo-yellow hover:bg-congo-yellow/90 text-grey-900 shadow-elegant',
    info: 'bg-congo-blue hover:bg-congo-blue/90 text-white shadow-elegant'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-xl'
  };

  return (
    <Button
      type={type}
      className={cn(
        'font-medium transition-all duration-300 border-0',
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
};

// Congo Card Component
interface CongoCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'success' | 'warning' | 'info';
  className?: string;
  onClick?: () => void;
}

export const CongoCard: React.FC<CongoCardProps> = ({
  children,
  variant = 'default',
  className,
  onClick,
  ...props
}) => {
  const variants = {
    default: 'bg-card border border-congo-red/20 shadow-congo',
    electric: 'congo-gradient-electric text-white border-0 shadow-congo-intense',
    vibrant: 'congo-gradient-vibrant text-white border-0 shadow-congo-vibrant',
    glow: 'bg-card border border-congo-blue/30 shadow-congo-glow',
    success: 'bg-card border border-congo-green/30 shadow-elegant',
    warning: 'bg-card border border-congo-yellow/30 shadow-elegant',
    info: 'bg-card border border-congo-blue/30 shadow-elegant'
  };

  return (
    <Card
      className={cn(
        'p-6 rounded-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]',
        variants[variant],
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
};

// Congo Badge Component
interface CongoBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CongoBadge: React.FC<CongoBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-congo-red/10 text-congo-red border border-congo-red/20',
    electric: 'congo-gradient-electric text-white border-0',
    vibrant: 'congo-gradient-vibrant text-white border-0',
    glow: 'bg-congo-blue/10 text-congo-blue border border-congo-blue/20',
    success: 'bg-congo-green/10 text-congo-green border border-congo-green/20',
    warning: 'bg-congo-yellow/10 text-congo-yellow border border-congo-yellow/20',
    info: 'bg-congo-blue/10 text-congo-blue border border-congo-blue/20'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs rounded-md',
    md: 'px-3 py-1.5 text-sm rounded-lg',
    lg: 'px-4 py-2 text-base rounded-xl'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Congo Gradient Background Component
interface CongoGradientProps {
  children: React.ReactNode;
  variant?: 'default' | 'electric' | 'vibrant' | 'glow' | 'subtle' | 'mesh';
  className?: string;
}

export const CongoGradient: React.FC<CongoGradientProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'congo-gradient',
    electric: 'congo-gradient-electric',
    vibrant: 'congo-gradient-vibrant',
    glow: 'congo-gradient-glow',
    subtle: 'congo-gradient-subtle',
    mesh: 'bg-gradient-congo-mesh'
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};