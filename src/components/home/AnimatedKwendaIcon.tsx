import React from 'react';
import { motion } from 'framer-motion';
import kwendaIcon from '@/assets/kwenda-icon.png';

export const AnimatedKwendaIcon: React.FC = () => {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Conteneur principal */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Glow effect pulsant */}
        <motion.div
          className="absolute inset-0 -inset-2 rounded-full bg-primary/20 dark:bg-primary/30 blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Icône principale avec backdrop élégant */}
        <motion.div
          className="relative z-10 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-md rounded-full p-3 border border-primary/30 shadow-lg"
          animate={{
            boxShadow: [
              '0 4px 20px rgba(139, 92, 246, 0.3)',
              '0 4px 30px rgba(139, 92, 246, 0.5)',
              '0 4px 20px rgba(139, 92, 246, 0.3)',
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.img
            src={kwendaIcon}
            alt="Kwenda"
            className="h-11 w-11 sm:h-12 sm:w-12 object-contain drop-shadow-lg"
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Shine effect subtil */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              pointerEvents: 'none'
            }}
          />
        </motion.div>

        {/* Mini particules scintillantes */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/70 rounded-full blur-[1px]"
            style={{
              top: `${15 + i * 25}%`,
              left: `${5 + i * 30}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0, 1, 0],
              scale: [0.3, 1.2, 0.3],
            }}
            transition={{
              duration: 2.5 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};