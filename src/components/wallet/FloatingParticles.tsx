import React from 'react';
import { motion } from 'framer-motion';

interface FloatingParticlesProps {
  color?: string;
  count?: number;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({ 
  color = 'white', 
  count = 15 
}) => {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: `hsl(var(--${color}) / 0.2)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};
