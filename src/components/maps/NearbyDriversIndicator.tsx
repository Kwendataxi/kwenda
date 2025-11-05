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

  const displayCount = driverCount > 99 ? '99+' : driverCount.toString();

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all ${className}`}
    >
      <div className="relative">
        {/* Pulse animation subtil en arrière-plan */}
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-primary rounded-full -z-10"
        />
        
        {/* Icône de voiture */}
        <Car className="w-6 h-6 text-primary" strokeWidth={2.5} />
        
        {/* Badge de notification style iOS/Android */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900"
        >
          {displayCount}
        </motion.div>
      </div>
    </motion.button>
  );
};
