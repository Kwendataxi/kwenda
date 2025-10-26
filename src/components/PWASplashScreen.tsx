import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const PWASplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Afficher le splash pendant 3 secondes
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 600);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 30%, #991B1B 60%, #7F1D1D 100%)"
          }}
        >
          {/* Particules flottantes minimalistes */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/5"
                style={{
                  width: Math.random() * 60 + 30,
                  height: Math.random() * 60 + 30,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  filter: 'blur(2px)',
                }}
                animate={{
                  y: [0, -15, 0],
                  x: [0, Math.random() * 10 - 5, 0],
                  opacity: [0.05, 0.1, 0.05],
                }}
                transition={{
                  duration: 6 + Math.random() * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>

          {/* Contenu central */}
          <div className="relative flex flex-col items-center gap-8 z-10">
            {/* Logo avec animation ultra-douce */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1,
              }}
              transition={{ 
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.2
              }}
              className="relative"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Halo doux et subtil */}
              <motion.div
                className="absolute -inset-12 blur-[80px]"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
                style={{
                  background: "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(220, 38, 38, 0.2) 40%, transparent 70%)"
                }}
              />
              
              {/* Logo principal - Animation respiration premium */}
              <motion.img
                src="/kwenda-splash-logo.png"
                alt="Kwenda"
                className="w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 object-contain relative z-10"
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [0.95, 1, 0.95],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translate3d(0, 0, 0)',
                  filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.3))'
                }}
              />
            </motion.div>

            {/* Slogan uniquement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="text-xl sm:text-2xl text-white font-light tracking-wide">
                Courses abordables tous les jours !
              </p>
            </motion.div>

            {/* Spinner moderne premium */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-10"
            >
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))'
                }}
              />
            </motion.div>
          </div>

          {/* Vignette subtile en bas */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(127, 29, 29, 0.4), transparent)"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
