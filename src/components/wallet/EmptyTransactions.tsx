import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, TrendingUp } from 'lucide-react';

export const EmptyTransactions: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <Receipt className="w-12 h-12 text-primary" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-accent/30 rounded-full flex items-center justify-center"
        >
          <TrendingUp className="w-4 h-4 text-accent" />
        </motion.div>
      </motion.div>

      <h3 className="text-lg font-bold text-foreground mb-2">
        Aucune transaction pour l'instant
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Commencez à utiliser votre portefeuille KwendaPay pour voir vos transactions apparaître ici
      </p>

      <motion.div
        className="mt-6 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary/30 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};
