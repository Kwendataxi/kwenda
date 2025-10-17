import { motion } from 'framer-motion';

interface IllustrationProps {
  context: string;
  className?: string;
}

export const OnboardingIllustration = ({ context, className = "" }: IllustrationProps) => {
  const illustrations = {
    client: (
      <motion.div
        className={`relative ${className}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-2xl"
          animate={{
            boxShadow: [
              '0 10px 40px rgba(239,68,68,0.3)',
              '0 15px 50px rgba(239,68,68,0.5)',
              '0 10px 40px rgba(239,68,68,0.3)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-6xl sm:text-7xl">🚗</span>
        </motion.div>
        
        <motion.div
          className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚡
        </motion.div>
      </motion.div>
    ),
    
    chauffeur: (
      <motion.div
        className={`relative ${className}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl"
          animate={{
            boxShadow: [
              '0 10px 40px rgba(34,197,94,0.3)',
              '0 15px 50px rgba(34,197,94,0.5)',
              '0 10px 40px rgba(34,197,94,0.3)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-6xl sm:text-7xl">👨‍✈️</span>
        </motion.div>
        
        <motion.div
          className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-2xl"
          animate={{
            y: [0, 10, 0],
            rotate: [0, -10, 10, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          💰
        </motion.div>
      </motion.div>
    ),
    
    partenaire: (
      <motion.div
        className={`relative ${className}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl"
          animate={{
            boxShadow: [
              '0 10px 40px rgba(168,85,247,0.3)',
              '0 15px 50px rgba(168,85,247,0.5)',
              '0 10px 40px rgba(168,85,247,0.3)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-6xl sm:text-7xl">🚙</span>
        </motion.div>
        
        <motion.div
          className="absolute -top-2 -left-2 w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-2xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📊
        </motion.div>
      </motion.div>
    ),
    
    marketplace: (
      <motion.div
        className={`relative ${className}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl"
          animate={{
            boxShadow: [
              '0 10px 40px rgba(59,130,246,0.3)',
              '0 15px 50px rgba(59,130,246,0.5)',
              '0 10px 40px rgba(59,130,246,0.3)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-6xl sm:text-7xl">🛍️</span>
        </motion.div>
        
        <motion.div
          className="absolute -bottom-2 -left-2 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-2xl"
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          🔒
        </motion.div>
      </motion.div>
    ),
    
    admin: (
      <motion.div
        className={`relative ${className}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl"
          animate={{
            boxShadow: [
              '0 10px 40px rgba(239,68,68,0.3)',
              '0 15px 50px rgba(239,68,68,0.5)',
              '0 10px 40px rgba(239,68,68,0.3)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-6xl sm:text-7xl">⚙️</span>
        </motion.div>
        
        <motion.div
          className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl"
          animate={{
            y: [0, -5, 0],
            x: [0, 5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔐
        </motion.div>
      </motion.div>
    ),
  };

  return illustrations[context as keyof typeof illustrations] || illustrations.client;
};
