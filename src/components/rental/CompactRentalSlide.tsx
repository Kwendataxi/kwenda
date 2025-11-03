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
    <div className="relative rounded-2xl h-[160px] bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <div className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Icône comme les autres slides */}
          <div className="text-4xl sm:text-5xl opacity-90">
            🚗
          </div>
          
          <div>
            {/* Titre aligné avec les autres */}
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight mb-0.5 sm:mb-1">
              Location de véhicules
            </h3>
            {/* Sous-titre comme les autres */}
            <p className="text-white/80 text-xs sm:text-sm font-medium">
              À partir de {(startingPrice / 1000).toFixed(0)}K CDF/jour
            </p>
          </div>
        </div>

        {/* CTA aligné avec les autres slides */}
        <button 
          onClick={onReserve}
          className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border border-white/30"
        >
          Réserver →
        </button>
      </div>
    </div>
  );
};
