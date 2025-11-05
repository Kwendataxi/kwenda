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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-2xl hover:shadow-[0_20px_50px_rgba(239,68,68,0.3)] transition-all duration-300 ${className}`}
    >
      <div className="relative">
        {/* Pulse animation subtil en arrière-plan */}
        <motion.div
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-primary/30 rounded-full blur-sm"
        />
        
        {/* Icône de voiture avec gradient */}
        <div className="relative">
          <Car className="w-7 h-7 text-primary drop-shadow-md" strokeWidth={2.5} />
        </div>
        
        {/* Badge de notification moderne et visible */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 15,
            delay: 0.1 
          }}
          className="absolute -top-3 -right-3 bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-extrabold rounded-full min-w-[28px] h-7 px-2 flex items-center justify-center shadow-[0_4px_14px_rgba(239,68,68,0.6)] border-[3px] border-white dark:border-gray-900 ring-2 ring-red-500/20"
        >
          <span className="drop-shadow-sm">{displayCount}</span>
        </motion.div>
        
        {/* Glow effect sur le badge */}
        <motion.div
          animate={{ 
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute -top-3 -right-3 bg-red-500 rounded-full min-w-[28px] h-7 blur-md opacity-50 pointer-events-none"
        />
      </div>
    </motion.button>
  );
};
