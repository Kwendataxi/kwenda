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
        {/* Badge en haut à droite */}
        <div className="absolute top-2 right-2 bg-yellow-400/90 text-emerald-900 px-2.5 py-1 rounded-full font-black text-[10px] shadow-lg">
          {vehicleCount}+ DISPONIBLES
        </div>

        {/* Layout horizontal : Info + CTA */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* Partie gauche : Emoji + Titre + Prix inline */}
          <div className="flex-1 flex items-center gap-3">
            {/* Emoji grand à gauche */}
            <div className="text-5xl">🚗</div>
            
            {/* Titre + Prix verticalement */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                Location de véhicules
              </h3>
              
              {/* Prix inline compact */}
              <div className="inline-flex items-baseline gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                <span className="text-xs text-white/70 font-medium">À partir de</span>
                <span className="text-lg font-black text-white">{startingPrice.toLocaleString()}</span>
                <span className="text-xs text-white/90 font-bold">CDF/jour</span>
              </div>
            </div>
          </div>
          
          {/* Partie droite : CTA */}
          <button 
            onClick={onReserve}
            className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-all shrink-0"
          >
            Réserver →
          </button>
        </div>

        {/* Glow effect subtil */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Bordure brillante */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    </motion.div>
  );
};
