import React from 'react';
import { motion } from 'framer-motion';

interface CompactRentalSlideProps {
  onReserve: () => void;
  vehicleCount?: number;
  startingPrice?: number;
}

export const CompactRentalSlide: React.FC<CompactRentalSlideProps> = ({ 
  onReserve,
  vehicleCount = 25,
  startingPrice = 50000
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl h-[140px]"
    >
      {/* Gradient de fond */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600" />
      
      {/* Overlay subtil */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />

      <div className="relative h-full p-3 flex items-center">
        {/* Badge ultra-compact */}
        <div className="absolute top-2 right-2 bg-yellow-400/90 text-emerald-900 px-2 py-0.5 rounded-full font-black text-[9px] shadow-lg">
          {vehicleCount}+ DISPOS
        </div>

        {/* Layout horizontal simplifié */}
        <div className="flex items-center justify-between w-full gap-3">
          {/* Titre avec emoji intégré + Prix inline minuscule */}
          <div className="flex-1">
            <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
              🚗 Location de<br />
              véhicules
            </h3>
            
            {/* Prix ultra-compact inline */}
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-[10px] text-white/70">dès</span>
              <span className="text-sm font-black text-white">{(startingPrice / 1000).toFixed(0)}K</span>
              <span className="text-[10px] text-white/80">CDF/j</span>
            </div>
          </div>
          
          {/* CTA compact */}
          <button 
            onClick={onReserve}
            className="bg-white text-emerald-600 px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all"
          >
            Réserver →
          </button>
        </div>

        {/* Glow subtil */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Bordure brillante */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    </motion.div>
  );
};
