import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const PWASplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Afficher le splash pendant 2.5 secondes
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Attendre la fin de l'animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/10"
        >
          <div className="relative flex flex-col items-center gap-6">
            {/* Logo avec animation de pulse et rotation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [0, 360, 360],
              }}
              transition={{ 
                duration: 1.2,
                times: [0, 0.6, 1],
                ease: "easeOut"
              }}
              className="relative"
            >
              <motion.img
                src="/kwenda-logo.png"
                alt="Kwenda"
                className="w-32 h-32 object-contain drop-shadow-2xl"
                animate={{
                  filter: [
                    "drop-shadow(0 0 20px rgba(220, 38, 38, 0.3))",
                    "drop-shadow(0 0 40px rgba(220, 38, 38, 0.6))",
                    "drop-shadow(0 0 20px rgba(220, 38, 38, 0.3))",
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Cercle animé autour du logo */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Texte avec animation de fondu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Kwenda
              </h1>
              <p className="text-sm text-muted-foreground">
                Votre compagnon de mobilité
              </p>
            </motion.div>

            {/* Barre de chargement animée */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
              className="w-48 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{
                  x: ["-100%", "100%"]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
