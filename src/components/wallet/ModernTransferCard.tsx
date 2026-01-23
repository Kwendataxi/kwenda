import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ModernTransferCardProps {
  type: 'transfer_in' | 'transfer_out';
  amount: number;
  currency: string;
  contactName: string;
  description: string;
  status: string;
  timestamp: string;
  index: number;
}

export const ModernTransferCard = ({
  type,
  amount,
  currency,
  contactName,
  description,
  status,
  timestamp,
  index
}: ModernTransferCardProps) => {
  const isReceived = type === 'transfer_in';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.02, x: 5 }}
    >
      <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-card to-card/95">
        <div className="p-4 flex items-center gap-4">
          {/* Avatar moderne avec gradient */}
          <motion.div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isReceived 
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}
            whileHover={{ rotate: 5, scale: 1.1 }}
          >
            {isReceived ? (
              <ArrowDownLeft className="h-5 w-5 text-white" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-white" />
            )}
          </motion.div>

          {/* Info principale */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {contactName}
              </h4>
              {status === 'completed' && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
              )}
              {status === 'pending' && (
                <Clock className="h-3 w-3 text-orange-500 flex-shrink-0 animate-pulse" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {isReceived ? 'Transfert reçu' : 'Transfert envoyé'}
              </p>
              <span className="text-xs text-muted-foreground/60">•</span>
              <p className="text-xs text-muted-foreground/80">
                {formatDistanceToNow(new Date(timestamp), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </p>
            </div>
          </div>

          {/* Montant avec style moderne */}
          <div className="text-right">
            <motion.div 
              className={`text-lg font-bold ${
                isReceived ? 'text-emerald-600' : 'text-blue-600'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 + 0.1 }}
            >
              {isReceived ? '+' : '-'}{amount.toLocaleString()} {currency}
            </motion.div>
            <Badge 
              variant={isReceived ? 'default' : 'secondary'}
              className={`text-xs px-2 py-0 ${
                isReceived 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isReceived ? 'Crédit' : 'Débit'}
            </Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
