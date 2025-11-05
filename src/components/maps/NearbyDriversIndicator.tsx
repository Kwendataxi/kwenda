import React from 'react';
import { Car } from 'lucide-react';
import { motion } from 'framer-motion';

interface NearbyDriversIndicatorProps {
  driverCount: number;
  onClick?: () => void;
  className?: string;
}

export const NearbyDriversIndicator = ({ 
  driverCount, 
  onClick,
  className 
}: NearbyDriversIndicatorProps) => {
  if (driverCount === 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`absolute top-4 right-4 z-10 bg-card/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-border/50 hover:shadow-xl transition-all ${className}`}
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <Car className="w-5 h-5 text-primary" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </motion.div>
        
        <div className="flex flex-col items-start">
          <span className="text-xs text-muted-foreground leading-none">Chauffeurs</span>
          <span className="text-lg font-bold text-foreground leading-none">{driverCount}</span>
        </div>
      </div>
    </motion.button>
  );
};
