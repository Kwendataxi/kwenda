import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

type Operator = 'airtel' | 'orange' | 'mpesa';

interface OperatorSelectorProps {
  selected: Operator | '';
  onSelect: (operator: Operator) => void;
}

const operators = [
  { 
    id: 'airtel' as Operator, 
    name: 'Airtel Money',
    bgColor: 'bg-red-500',
    shadowColor: 'shadow-red-500/40'
  },
  { 
    id: 'orange' as Operator, 
    name: 'Orange Money',
    bgColor: 'bg-orange-500',
    shadowColor: 'shadow-orange-500/40'
  },
  { 
    id: 'mpesa' as Operator, 
    name: 'M-Pesa',
    bgColor: 'bg-green-500',
    shadowColor: 'shadow-green-500/40'
  },
];

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  selected,
  onSelect
}) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
        Opérateur mobile
      </label>
      <div className="grid grid-cols-3 gap-3">
        {operators.map((operator, index) => (
          <motion.button
            key={operator.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(operator.id)}
            className={cn(
              "relative flex flex-col items-center justify-center",
              "aspect-square rounded-2xl p-4",
              "transition-all duration-200",
              selected === operator.id
                ? `${operator.bgColor} border-transparent shadow-2xl ${operator.shadowColor} ring-2 ring-${operator.bgColor.split('-')[1]}-500/30`
                : "bg-zinc-800/50 border-2 border-zinc-700/50 hover:border-zinc-600"
            )}
          >
            {selected === operator.id && (
              <motion.div
                layoutId="operatorBadge"
                className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-zinc-900 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              />
            )}
            
            <div className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 rounded-xl mb-2",
              "flex items-center justify-center",
              selected === operator.id 
                ? "bg-white/20" 
                : "bg-zinc-700/50"
            )}>
              <Smartphone className={cn(
                "w-6 h-6 sm:w-8 sm:h-8",
                selected === operator.id ? "text-white" : "text-zinc-400"
              )} />
            </div>
            
            <span className={cn(
              "text-xs sm:text-sm font-bold text-center",
              selected === operator.id ? "text-white" : "text-zinc-400"
            )}>
              {operator.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
