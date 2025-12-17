import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import orangeMoneyLogo from '@/assets/orange-money-logo.webp';
import airtelMoneyLogo from '@/assets/airtel-money-logo.png';
import mpesaLogo from '@/assets/mpesa-logo.png';

type Operator = 'airtel' | 'orange' | 'mpesa';

interface OperatorSelectorProps {
  selected: Operator | '';
  onSelect: (operator: Operator) => void;
}

const operators = [
  { 
    id: 'airtel' as Operator, 
    name: 'Airtel Money',
    gradientClass: 'bg-gradient-to-br from-red-500 to-red-700',
    shadowClass: 'shadow-red-500/40',
    disabled: true,
    badge: 'Bientôt'
  },
  { 
    id: 'orange' as Operator, 
    name: 'Orange Money',
    gradientClass: 'bg-gradient-to-br from-orange-500 to-orange-700',
    shadowClass: 'shadow-orange-500/40',
    disabled: false,
    badge: null
  },
  { 
    id: 'mpesa' as Operator, 
    name: 'M-Pesa',
    gradientClass: 'bg-gradient-to-br from-green-500 to-green-700',
    shadowClass: 'shadow-green-500/40',
    disabled: true,
    badge: 'Bientôt'
  },
];

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  selected,
  onSelect
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {operators.map((operator, index) => (
        <motion.button
          key={operator.id}
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: operator.disabled ? 1 : 1.02, y: operator.disabled ? 0 : -2 }}
          whileTap={{ scale: operator.disabled ? 1 : 0.98 }}
          onClick={() => {
            console.log('🔘 Clic sur opérateur:', operator.id, 'disabled:', operator.disabled);
            if (!operator.disabled) {
              onSelect(operator.id);
            }
          }}
          disabled={operator.disabled}
          className={cn(
            "relative flex flex-col items-center justify-center",
            "aspect-square rounded-2xl p-4",
            "transition-all duration-200",
            "pointer-events-auto z-10",
            operator.disabled && "opacity-50 cursor-not-allowed",
            selected === operator.id && !operator.disabled
              ? cn(
                  operator.gradientClass,
                  "border-2 border-white text-white shadow-2xl",
                  operator.shadowClass,
                  "ring-4 ring-white/30 scale-105"
                )
              : "bg-white/15 backdrop-blur-md border-2 border-white/30 hover:border-white/50 hover:bg-white/20 shadow-xl"
          )}
        >
          {operator.badge && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 bg-zinc-700/90 backdrop-blur-sm text-zinc-300 text-xs font-semibold px-2 py-0.5 shadow-lg border border-zinc-600"
            >
              {operator.badge}
            </Badge>
          )}
          
          {selected === operator.id && !operator.disabled && (
            <motion.div
              layoutId="operatorBadge"
              className="absolute -top-2 -left-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-zinc-900 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            />
          )}
          
          <div className={cn(
            "w-12 h-12 sm:w-16 sm:h-16 rounded-xl mb-2 transition-all duration-200",
            "flex items-center justify-center overflow-hidden",
            selected === operator.id 
              ? "bg-white/30 backdrop-blur-md shadow-inner" 
              : "bg-white/10 backdrop-blur-sm"
          )}>
            {operator.id === 'orange' ? (
              <img 
                src={orangeMoneyLogo} 
                alt="Orange Money"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-lg"
              />
            ) : operator.id === 'airtel' ? (
              <img 
                src={airtelMoneyLogo} 
                alt="Airtel Money"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-lg"
              />
            ) : operator.id === 'mpesa' ? (
              <img 
                src={mpesaLogo} 
                alt="M-Pesa"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-lg"
              />
            ) : (
              <Smartphone className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 transition-colors",
                selected === operator.id ? "text-white drop-shadow-lg" : "text-white/60"
              )} />
            )}
          </div>
          
          <span className={cn(
            "text-xs sm:text-sm font-bold text-center transition-colors",
            selected === operator.id ? "text-white drop-shadow-md" : "text-white/80"
          )}>
            {operator.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
