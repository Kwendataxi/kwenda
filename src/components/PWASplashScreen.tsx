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
            background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)"
          }}
        >
          {/* Particules flottantes en arrière-plan */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/8"
                style={{
                  width: Math.random() * 80 + 40,
                  height: Math.random() * 80 + 40,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -25, 0],
                  x: [0, Math.random() * 15 - 7.5, 0],
                  opacity: [0.08, 0.15, 0.08],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Contenu central */}
          <div className="relative flex flex-col items-center gap-8 z-10">
            {/* Logo avec animation douce */}
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
              {/* Glow effect rouge derrière le logo */}
              <motion.div
                className="absolute inset-0 blur-3xl"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [0.95, 1.15, 0.95],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: "radial-gradient(circle, rgba(220, 38, 38, 0.6) 0%, rgba(185, 28, 28, 0.3) 50%, transparent 80%)"
                }}
              />
              
              {/* Logo principal - Taille responsive */}
              <motion.img
                src="/kwenda-splash-logo.png"
                alt="Kwenda"
                className="w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 object-contain relative z-10"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                style={{ 
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)'
                }}
              />
            </motion.div>

            {/* Texte avec animation de slide moderne */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-3"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Kwenda
              </h1>
              <p className="text-lg sm:text-xl text-white/80 font-light">
                Votre mobilité réinventée
              </p>
            </motion.div>

            {/* Indicateur de chargement minimaliste */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex gap-2.5 mt-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-white/60"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                  style={{ willChange: 'transform, opacity' }}
                />
              ))}
            </motion.div>
          </div>

          {/* Gradient overlay rouge en bas */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(153, 27, 27, 0.6), transparent)"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
