import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Car, Building2, Star, Sparkles } from 'lucide-react';

interface PremiumRentalBannerProps {
  vehiclesCount: number;
  partnersCount: number;
  onExplore?: () => void;
}

export const PremiumRentalBanner: React.FC<PremiumRentalBannerProps> = ({
  vehiclesCount,
  partnersCount,
  onExplore,
}) => {
  const floatingEmojis = ['🚗', '🚙', '🚐', '🏎️', '🚕'];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 mx-4 mt-4 rounded-3xl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Floating emojis */}
      {floatingEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl opacity-20"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        <div className="max-w-lg">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4"
          >
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-white/90 text-sm font-medium">Kwenda Location</span>
          </motion.div>

          {/* Title with typewriter effect */}
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-white mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Louez votre véhicule{' '}
            <span className="relative">
              <span className="text-yellow-300">idéal</span>
              <motion.span
                className="absolute -bottom-1 left-0 h-1 bg-yellow-300/50 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-white/80 mb-6 text-sm md:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            SUV • Berlines • 4x4 • Avec ou sans chauffeur
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              onClick={onExplore}
              className="group bg-white text-emerald-700 hover:bg-white/90 rounded-xl px-6 h-12 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <span>Explorer maintenant</span>
              <motion.div
                className="ml-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex items-center gap-6 mt-6 pt-6 border-t border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Car className="h-4 w-4 text-white" />
              </div>
              <div>
                <motion.span
                  className="text-white font-bold text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {vehiclesCount}+
                </motion.span>
                <p className="text-white/70 text-xs">Véhicules</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <motion.span
                  className="text-white font-bold text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  {partnersCount}+
                </motion.span>
                <p className="text-white/70 text-xs">Agences</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Star className="h-4 w-4 text-yellow-300" />
              </div>
              <div>
                <span className="text-white font-bold text-lg">4.8</span>
                <p className="text-white/70 text-xs">Note</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative gradient orb */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-br from-yellow-400/30 to-orange-500/20 rounded-full blur-3xl" />
    </div>
  );
};
