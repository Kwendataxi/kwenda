import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const PWASplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Afficher le splash pendant 2 secondes (optimisé)
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 400);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            background: [
              "radial-gradient(circle at 30% 20%, #EF4444 0%, #DC2626 40%, #B91C1C 100%)",
              "radial-gradient(circle at 70% 80%, #EF4444 0%, #DC2626 40%, #B91C1C 100%)",
              "radial-gradient(circle at 30% 20%, #EF4444 0%, #DC2626 40%, #B91C1C 100%)"
            ]
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.4 },
            background: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        >
          {/* Particules flottantes dynamiques */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => {
              const size = Math.random() * 60 + 30;
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/15"
                  style={{
                    width: size,
                    height: size,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    filter: `blur(${Math.random() * 3 + 1}px)`,
                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.random() * 15 - 7.5, 0],
                    opacity: [0.1, 0.3, 0.1],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: Math.random() * 2,
                  }}
                />
              );
            })}
          </div>

          {/* Contenu central */}
          <div className="relative flex items-center justify-center z-10">
            {/* Logo avec animation dynamique */}
            <motion.div
              initial={{ 
                scale: 0.3,
                opacity: 0,
                rotate: -15
              }}
              animate={{ 
                scale: 1,
                opacity: 1,
                rotate: 0
              }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1
              }}
              className="relative"
            >
              {/* Halo énergique concentré */}
              <motion.div
                className="absolute -inset-16 blur-[80px]"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [0.95, 1.1, 0.95]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.3)"
                }}
              />
              
              {/* Logo principal - Animation multi-axes */}
              <motion.img
                src="/kwenda-splash-logo.png"
                alt="Kwenda"
                className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 object-contain relative z-10"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, 0, -2, 0],
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ 
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                  filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.4))'
                }}
              />
            </motion.div>

          </div>

          {/* Vignette subtile en bas */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(185, 28, 28, 0.5), transparent)"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
