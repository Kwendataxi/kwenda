import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock, ArrowRight } from 'lucide-react';

interface SoftServiceCardProps {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
  price?: number;
  distance?: number;
  duration?: number;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

const SoftServiceCard: React.FC<SoftServiceCardProps> = ({
  id,
  name,
  subtitle,
  icon: ServiceIcon,
  estimatedTime,
  price,
  distance,
  duration,
  isSelected,
  isLoading,
  onSelect
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getServiceGradient = (serviceId: string) => {
    switch (serviceId) {
      case 'flash': return 'from-congo-red/20 to-congo-red/5';
      case 'flex': return 'from-congo-yellow/20 to-congo-yellow/5';
      case 'maxicharge': return 'from-congo-blue/20 to-congo-blue/5';
      default: return 'from-primary/20 to-primary/5';
    }
  };

  const getIconColor = (serviceId: string) => {
    switch (serviceId) {
      case 'flash': return 'text-congo-red';
      case 'flex': return 'text-congo-yellow';
      case 'maxicharge': return 'text-congo-blue';
      default: return 'text-primary';
    }
  };

  const getServiceEmoji = (serviceId: string) => {
    switch (serviceId) {
      case 'flash': return '⚡';
      case 'flex': return '📦';
      case 'maxicharge': return '🚛';
      default: return '📦';
    }
  };

  return (
    <div 
      className={cn(
        "relative flex-shrink-0 w-48 h-32 cursor-pointer transition-all duration-300",
        "rounded-2xl backdrop-blur-xl overflow-hidden group",
        "hover:scale-105 active:scale-95",
        isSelected 
          ? "ring-2 ring-primary shadow-glow bg-gradient-to-br from-card/95 to-card/85" 
          : "hover:shadow-lg bg-gradient-to-br from-card/70 to-card/50"
      )}
      onClick={onSelect}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        getServiceGradient(id)
      )} />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-fade">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        {/* Header avec icône et nom seulement */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {getServiceEmoji(id)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground truncate">
              {name.replace('Kwenda ', '')}
            </h3>
          </div>
        </div>

        {/* Prix et temps - Information essentielle seulement */}
        <div className="flex items-end justify-between">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce" />
              <span className="text-xs text-muted-foreground">...</span>
            </div>
          ) : price ? (
            <div className="flex flex-col">
              <div className="text-lg font-bold text-foreground">
                {formatPrice(price)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {estimatedTime}
              </div>
            </div>
          ) : (
            <div className="text-xs text-destructive">
              Indisponible
            </div>
          )}

          {isSelected && (
            <div className="text-primary animate-bounce">
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphism hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default SoftServiceCard;