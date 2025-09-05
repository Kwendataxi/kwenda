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
      case 'flash':
        return 'from-congo-red/20 via-primary/10 to-transparent';
      case 'flex': 
        return 'from-congo-yellow/20 via-secondary/10 to-transparent';
      case 'maxicharge':
        return 'from-congo-blue/20 via-info/10 to-transparent';
      default:
        return 'from-primary/20 via-primary/10 to-transparent';
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

  return (
    <div 
      className={cn(
        "relative flex-shrink-0 w-72 h-48 cursor-pointer transition-all duration-300",
        "rounded-2xl border backdrop-blur-xl overflow-hidden",
        "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
        isSelected 
          ? "border-primary/40 shadow-glow bg-gradient-to-br from-card/90 to-card/70" 
          : "border-border/20 hover:border-primary/30 bg-gradient-to-br from-card/60 to-card/40"
      )}
      onClick={onSelect}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        getServiceGradient(id)
      )} />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-fade">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl bg-background/20 backdrop-blur-sm border border-background/30",
            getIconColor(id)
          )}>
            <ServiceIcon className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Time badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-background/20">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {estimatedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Price section */}
        <div className="flex items-end justify-between">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Calcul...</span>
            </div>
          ) : price ? (
            <div>
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(price)}
              </div>
              {distance && duration && (
                <div className="text-xs text-muted-foreground">
                  {distance.toFixed(1)} km • {Math.round(duration)} min
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-destructive">
              Prix indisponible
            </div>
          )}

          {isSelected && (
            <div className="text-primary animate-fade-in">
              <ArrowRight className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphism overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-background/10 to-transparent",
        "opacity-0 transition-opacity duration-300",
        "hover:opacity-100"
      )} />
    </div>
  );
};

export default SoftServiceCard;