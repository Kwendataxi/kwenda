import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Send, Gift, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  onClick: () => void;
}

interface WalletQuickActionsProps {
  onRecharge: () => void;
  onTransfer: () => void;
  onConvert: () => void;
  onHistory: () => void;
}

export const WalletQuickActions: React.FC<WalletQuickActionsProps> = ({
  onRecharge,
  onTransfer,
  onConvert,
  onHistory
}) => {
  const actions: QuickAction[] = [
    {
      id: 'recharge',
      label: 'Recharger',
      icon: Zap,
      color: 'text-congo-green',
      gradient: 'from-congo-green to-congo-green-electric',
      onClick: onRecharge
    },
    {
      id: 'transfer',
      label: 'Transférer',
      icon: Send,
      color: 'text-congo-blue',
      gradient: 'from-congo-blue to-congo-blue-electric',
      onClick: onTransfer
    },
    {
      id: 'convert',
      label: 'Convertir',
      icon: Gift,
      color: 'text-congo-yellow',
      gradient: 'from-congo-yellow to-congo-yellow-vibrant',
      onClick: onConvert
    },
    {
      id: 'history',
      label: 'Historique',
      icon: Clock,
      color: 'text-congo-red',
      gradient: 'from-congo-red to-congo-red-vibrant',
      onClick: onHistory
    }
  ];

  return (
    <div className="px-4 -mt-6 mb-6">
      <div className="bg-white dark:bg-card/80 rounded-2xl shadow-lg border border-congo-red/10 dark:border-congo-red/20 p-4" style={{ boxShadow: '0 4px 20px hsl(var(--congo-red)/0.1)' }}>
        <div className="grid grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 group"
            >
              {/* Icône ronde */}
              <motion.div 
                className={cn(
                  "relative w-16 h-16 rounded-2xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-md",
                  "transition-all duration-300",
                  action.gradient
                )}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 8px 30px hsl(var(--congo-red) / 0.3)'
                }}
              >
                <action.icon className="h-7 w-7 text-white" />
              </motion.div>
              
              {/* Label */}
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
