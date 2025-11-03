import React from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { getStartupContext, StartupContext } from "@/services/startupContext";
import BrandLogo from "@/components/brand/BrandLogo";

interface DynamicSplashProps {
  context?: StartupContext;
}

export const DynamicSplash: React.FC<DynamicSplashProps> = ({ context }) => {
  const location = useLocation();
  const ctx = context || getStartupContext(location.pathname);

  // Slogans contextuels
  const getSloganByContext = () => {
    switch (ctx) {
      case 'client':
        return 'Courses abordables tous les jours !';
      case 'chauffeur':
        return 'Gagnez plus, roulez mieux !';
      case 'partenaire':
        return 'Gérez votre flotte efficacement !';
      case 'marketplace':
        return 'Achetez et vendez en toute sécurité !';
      case 'admin':
        return 'Supervision en temps réel';
      default:
        return 'Courses abordables tous les jours !';
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      animate={{
        background: [
          'linear-gradient(135deg, #DC2626 0%, #F59E0B 100%)',
          'linear-gradient(135deg, #B91C1C 0%, #FBBF24 100%)',
          'linear-gradient(135deg, #DC2626 0%, #F59E0B 100%)'
        ]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Lueurs dynamiques concentrées */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[60px]"
        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-[50px]"
        style={{ background: 'rgba(245, 158, 11, 0.25)' }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Particules optimisées */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const size = Math.random() * 4 + 2;
          const duration = Math.random() * 2 + 3;
          const delay = Math.random() * 2;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/25"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: `blur(${Math.random() * 2 + 1}px)`,
                boxShadow: '0 0 12px rgba(255, 255, 255, 0.4)',
              }}
              animate={{
                x: [0, Math.random() * 80 - 40, 0],
                y: [0, Math.random() * -120 - 40, 0],
                opacity: [0, 0.6, 0],
                scale: [0.6, 1.3, 0.6],
              }}
              transition={{ duration, delay, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          );
        })}
      </div>

      {/* Contenu central */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 180,
          damping: 18,
          duration: 0.6
        }}
        className="relative z-10 flex flex-col items-center px-6 gap-6"
      >
        {/* Logo avec halo énergique */}
        <div className="relative">
          <motion.div
            className="absolute -inset-6 rounded-full blur-[40px]"
            style={{ background: 'rgba(255, 255, 255, 0.3)' }}
            animate={{ 
              scale: [0.95, 1.15, 0.95],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.06, 1],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
          >
            <BrandLogo size={120} className="drop-shadow-2xl relative z-10 filter brightness-110" alt="Kwenda Logo" />
          </motion.div>
        </div>

        {/* Slogan dynamique compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center px-6"
        >
          <motion.h2
            className="text-white text-base sm:text-lg font-semibold tracking-wide leading-tight max-w-xs"
            style={{ 
              textShadow: '0 0 15px rgba(255,255,255,0.6), 0 2px 10px rgba(0,0,0,0.3)'
            }}
            animate={{
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          >
            {getSloganByContext()}
          </motion.h2>
        </motion.div>

        {/* Loading indicator moderne */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center"
        >
          <div className="relative w-10 h-10">
            {/* Cercle externe */}
            <motion.div
              className="absolute inset-0 rounded-full border-3 border-white/20 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
              }}
            />
            
            {/* Cercle interne */}
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-white/30 border-b-yellow-400"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Glow pulsant */}
            <motion.div
              className="absolute inset-0 rounded-full bg-white/10"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default DynamicSplash;
