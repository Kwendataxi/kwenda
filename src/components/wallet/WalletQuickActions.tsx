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
      color: 'text-green-600',
      gradient: 'from-green-500 to-emerald-600',
      onClick: onRecharge
    },
    {
      id: 'transfer',
      label: 'Transférer',
      icon: Send,
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-600',
      onClick: onTransfer
    },
    {
      id: 'convert',
      label: 'Convertir',
      icon: Gift,
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-amber-600',
      onClick: onConvert
    },
    {
      id: 'history',
      label: 'Historique',
      icon: Clock,
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-fuchsia-600',
      onClick: onHistory
    }
  ];

  return (
    <div className="px-4 -mt-6 mb-6">
      <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-4">
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
              <div className={cn(
                "relative w-16 h-16 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br shadow-md",
                "group-hover:shadow-xl group-hover:scale-105",
                "transition-all duration-300",
                action.gradient
              )}>
                <action.icon className="h-7 w-7 text-white" />
              </div>
              
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
