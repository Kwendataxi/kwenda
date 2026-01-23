import { motion } from 'framer-motion';

/**
 * Premium animated background for authentication pages
 * Features: Mesh gradient, floating orbs, grid pattern
 */
export const AuthBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      
      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0 opacity-60 dark:opacity-30">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 right-[20%] w-4 h-4 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full opacity-60"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-32 left-[15%] w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-50"
        animate={{
          y: [0, 15, 0],
          x: [0, 10, 0],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-[40%] left-[10%] w-2 h-2 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-40"
        animate={{
          y: [0, -10, 0],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute bottom-[25%] right-[12%] w-2.5 h-2.5 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full opacity-50"
        animate={{
          y: [0, 12, 0],
          x: [0, -8, 0],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-rose-200/30 via-rose-100/10 to-transparent dark:from-rose-900/20 dark:via-rose-900/5 dark:to-transparent blur-2xl" />
    </div>
  );
};
