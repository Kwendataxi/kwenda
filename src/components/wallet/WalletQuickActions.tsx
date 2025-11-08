import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, Zap } from 'lucide-react';
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
  onQuickTransfer: () => void;
}

export const WalletQuickActions: React.FC<WalletQuickActionsProps> = ({
  onRecharge,
  onTransfer,
  onQuickTransfer
}) => {
  const actions: QuickAction[] = [
    {
      id: 'recharge',
      label: 'Recharger',
      icon: Plus,
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
      id: 'quick_transfer',
      label: 'Rapide',
      icon: Zap,
      color: 'text-purple-500',
      gradient: 'from-purple-400 via-pink-500 to-purple-600',
      onClick: onQuickTransfer
    }
  ];

  return (
    <div className="px-4 -mt-6 mb-6">
      <div className="bg-white dark:bg-card/80 rounded-2xl shadow-lg border border-congo-red/10 dark:border-congo-red/20 p-5" style={{ boxShadow: '0 4px 20px hsl(var(--congo-red)/0.1)' }}>
        <div className="grid grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2.5 group"
            >
              {/* Icône ronde */}
              <motion.div 
                className={cn(
                  "relative w-20 h-20 rounded-2xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-md",
                  "transition-all duration-300",
                  action.gradient
                )}
                whileHover={{
                  scale: 1.08,
                  boxShadow: '0 10px 35px hsl(var(--congo-red) / 0.35)'
                }}
              >
                <action.icon className="h-8 w-8 text-white" />
              </motion.div>
              
              {/* Label */}
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
