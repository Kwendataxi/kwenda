import React from 'react';
import { motion } from 'framer-motion';
import { User, Car, Shield, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SoftDriverToggleProps {
  value: 'with_driver' | 'without_driver' | null;
  onChange: (value: 'with_driver' | 'without_driver') => void;
  withDriverPrice: number;
  withoutDriverPrice: number;
  driverRequired?: boolean;
  driverAvailable?: boolean;
  formatPrice: (price: number) => string;
}

export const SoftDriverToggle = ({
  value,
  onChange,
  withDriverPrice,
  withoutDriverPrice,
  driverRequired = false,
  driverAvailable = true,
  formatPrice
}: SoftDriverToggleProps) => {
  const options = [
    {
      id: 'with_driver' as const,
      icon: User,
      title: 'Avec chauffeur',
      description: 'Un chauffeur professionnel à votre service',
      price: withDriverPrice,
      features: ['Chauffeur expérimenté', 'Aucun souci de conduite', 'Service premium'],
      badge: driverRequired ? 'Obligatoire' : 'Recommandé',
      badgeVariant: driverRequired ? 'destructive' : 'default',
      disabled: false
    },
    {
      id: 'without_driver' as const,
      icon: Car,
      title: 'Sans chauffeur',
      description: 'Conduisez vous-même en toute liberté',
      price: withoutDriverPrice,
      features: ['Liberté totale', 'Permis requis', 'Caution demandée'],
      badge: null,
      badgeVariant: 'secondary',
      disabled: driverRequired || !driverAvailable
    }
  ];

  // Auto-select if only one option available
  React.useEffect(() => {
    if (driverRequired && value !== 'with_driver') {
      onChange('with_driver');
    } else if (!driverAvailable && value !== 'without_driver') {
      onChange('without_driver');
    }
  }, [driverRequired, driverAvailable, value, onChange]);

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = value === option.id;
        const Icon = option.icon;
        
        return (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => !option.disabled && onChange(option.id)}
            disabled={option.disabled}
            className={cn(
              "w-full p-4 rounded-2xl border-2 text-left transition-all duration-300",
              "relative overflow-hidden group",
              isSelected 
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Selection indicator */}
            <motion.div
              initial={false}
              animate={{ scale: isSelected ? 1 : 0 }}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-primary-foreground" />
            </motion.div>

            <div className="flex gap-4">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">{option.title}</h4>
                  {option.badge && (
                    <Badge 
                      variant={option.badgeVariant as any}
                      className="text-[10px] px-2 py-0"
                    >
                      {option.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {option.features.map((feature, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right">
                <p className={cn(
                  "text-lg font-bold",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {formatPrice(option.price)}
                </p>
                <p className="text-xs text-muted-foreground">/jour</p>
              </div>
            </div>

            {/* Subtle gradient overlay when selected */}
            {isSelected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5 pointer-events-none"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
