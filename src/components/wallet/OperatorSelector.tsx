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
    color: 'from-red-500 to-red-600',
    textColor: 'text-red-600',
    bgColor: 'bg-red-500/10'
  },
  { 
    id: 'orange' as Operator, 
    name: 'Orange Money',
    color: 'from-orange-500 to-orange-600',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-500/10'
  },
  { 
    id: 'mpesa' as Operator, 
    name: 'M-Pesa',
    color: 'from-green-600 to-green-700',
    textColor: 'text-green-600',
    bgColor: 'bg-green-500/10'
  },
];

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  selected,
  onSelect
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/90">Opérateur mobile</label>
      <div className="grid grid-cols-3 gap-3">
        {operators.map((operator, index) => (
          <motion.button
            key={operator.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(operator.id)}
            className={cn(
              "relative p-4 rounded-2xl border-2 transition-all duration-300",
              "flex flex-col items-center gap-2",
              selected === operator.id
                ? `border-transparent ${operator.bgColor} shadow-lg`
                : "border-border/50 bg-muted/30 hover:border-border"
            )}
          >
            {selected === operator.id && (
              <>
                <motion.div
                  layoutId="operatorGlow"
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-20",
                    operator.color
                  )}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              </>
            )}
            
            <motion.div
              animate={selected === operator.id ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                selected === operator.id ? operator.bgColor : "bg-muted"
              )}
            >
              <Smartphone className={cn(
                "w-6 h-6",
                selected === operator.id ? operator.textColor : "text-muted-foreground"
              )} />
            </motion.div>
            
            <span className={cn(
              "text-xs font-semibold text-center relative z-10",
              selected === operator.id ? operator.textColor : "text-muted-foreground"
            )}>
              {operator.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
