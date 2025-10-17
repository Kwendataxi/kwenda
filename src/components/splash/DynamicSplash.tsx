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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#DC2626] via-[#EF4444] to-[#F87171] overflow-hidden">
      {/* Lueurs dynamiques */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'rgba(252, 165, 165, 0.2)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
      />

      {/* Particules (30) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          const duration = Math.random() * 4 + 3;
          const delay = Math.random() * 3;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/30"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: 'blur(1px)',
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * -150 - 50, 0],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}
      </div>

      {/* Contenu central */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 flex flex-col items-center px-6"
      >
        {/* Logo avec halo */}
        <div className="relative">
          <motion.div
            className="absolute -inset-8 rounded-full blur-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            animate={{ y: [0, -10, 0], scale: [1, 1.02, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BrandLogo size={180} className="drop-shadow-2xl relative z-10" alt="Kwenda Logo" />
          </motion.div>
        </div>

        {/* Badge NOUVEAU */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="mt-12 inline-block px-4 py-1.5 rounded-full backdrop-blur-md"
          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
        >
          <span className="text-white text-xs font-semibold tracking-wide">✨ NOUVEAU</span>
        </motion.div>

        {/* Slogan dynamique */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-4 text-center px-8"
        >
          <h2
            className="text-white text-3xl font-black tracking-tight leading-tight"
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2)' }}
          >
            {getSloganByContext()}
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 mx-auto h-1 w-24 rounded-full"
            style={{ background: 'linear-gradient(to right, transparent, white, transparent)' }}
          />
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <div className="relative">
            <motion.div
              className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: 'rgba(255, 255, 255, 0.2)' }} />
          </div>
          <motion.p
            className="text-white/80 text-sm font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Chargement<motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>...</motion.span>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DynamicSplash;
