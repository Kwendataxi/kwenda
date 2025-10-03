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
      {/* Conteneur principal avec backdrop */}
      <motion.div
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Glow effect pulsant */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Border gradient animé */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-50"
          style={{
            background: 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Icône principale */}
        <motion.div
          className="relative z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 border border-primary/20"
          animate={{
            boxShadow: [
              '0 0 20px rgba(var(--primary-rgb), 0.3)',
              '0 0 30px rgba(var(--primary-rgb), 0.5)',
              '0 0 20px rgba(var(--primary-rgb), 0.3)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.img
            src={kwendaIcon}
            alt="Kwenda"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Shine effect qui traverse */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              pointerEvents: 'none'
            }}
          />
        </motion.div>

        {/* Mini particules flottantes */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/60 rounded-full"
            style={{
              top: `${20 + i * 30}%`,
              left: `${10 + i * 25}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};
