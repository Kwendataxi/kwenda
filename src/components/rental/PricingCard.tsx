import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  label: string;
  price: string;
  period: string;
  icon: LucideIcon;
  featured?: boolean;
  discount?: string;
  index?: number;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  label,
  price,
  period,
  icon: Icon,
  featured = false,
  discount,
  index = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300",
        featured 
          ? "border-primary bg-primary/5 shadow-lg scale-[1.02] sm:scale-105" 
          : "border-border bg-background hover:border-primary/50 hover:shadow-md"
      )}
    >
      {featured && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] sm:text-xs px-2 py-0.5">
          Le plus populaire
        </Badge>
      )}
      {discount && (
        <Badge className="absolute -top-2 right-2 bg-green-500 text-white text-[10px] sm:text-xs px-2 py-0.5">
          {discount}
        </Badge>
      )}
      
      <div className="text-center space-y-2 sm:space-y-3">
        <div className={cn(
          "h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-lg flex items-center justify-center transition-colors",
          featured ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn(
            "h-5 w-5 sm:h-6 sm:w-6",
            featured ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
        <div>
          <p className={cn(
            "text-xl sm:text-2xl font-bold",
            featured ? "text-primary" : "text-foreground"
          )}>
            {price}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{period}</p>
        </div>
      </div>
    </motion.div>
  );
};
