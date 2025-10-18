import React from 'react';
import { motion } from 'framer-motion';
import { Car, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className="relative overflow-hidden rounded-2xl h-[180px]"
    >
      {/* Gradient de fond */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600" />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Motifs décoratifs subtils */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-6 right-12 w-24 h-24 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-6 left-12 w-28 h-28 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative h-full p-4 flex flex-col justify-between">
        {/* Badge véhicules disponibles */}
        <div className="flex justify-end">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-yellow-400/90 text-yellow-900 px-3 py-1 rounded-full font-bold text-xs shadow-lg flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            {vehicleCount}+ disponibles
          </motion.div>
        </div>

        {/* Icône + Texte */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl flex-shrink-0"
          >
            <Car className="w-10 h-10 text-white drop-shadow-lg" />
          </motion.div>

          <div className="flex-1">
            <motion.h3 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg"
            >
              Location de véhicules
            </motion.h3>
            
            {/* Prix restructuré */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3"
            >
              {/* "À partir de" vertical */}
              <div className="flex flex-col text-white/80 text-[10px] font-medium leading-tight mt-1">
                <span>À</span>
                <span>partir</span>
                <span>de</span>
              </div>

              {/* Montant principal avec CDF en superscript */}
              <div className="flex items-start gap-1.5">
                <span className="text-4xl md:text-5xl font-black text-white drop-shadow-2xl tracking-tighter leading-none">
                  {startingPrice.toLocaleString()}
                </span>
                
                {/* CDF en haut + /jour en bas - bien espacés */}
                <div className="flex flex-col justify-between h-full pt-0.5">
                  <span className="text-lg md:text-xl font-bold text-white leading-none">CDF</span>
                  <span className="text-[11px] text-white/90 font-medium leading-none">/jour</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bouton CTA */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Button
              onClick={onReserve}
              className="bg-white text-emerald-600 hover:bg-white/90 rounded-full px-6 py-3 font-bold shadow-2xl text-sm group"
            >
              Réserver
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bordure brillante */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    </motion.div>
  );
};
