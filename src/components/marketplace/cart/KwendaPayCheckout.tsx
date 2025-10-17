import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Loader2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface KwendaPayCheckoutProps {
  isOpen: boolean;
  total: number;
  walletBalance: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const KwendaPayCheckout: React.FC<KwendaPayCheckoutProps> = ({
  isOpen,
  total,
  walletBalance,
  onConfirm,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isSufficient = walletBalance >= total;

  const handleConfirm = async () => {
    if (!isSufficient) return;
    
    setIsProcessing(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Payment confirmation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Paiement KwendaPay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Solde KwendaPay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-xl p-4 ${
              isSufficient 
                ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20' 
                : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isSufficient ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <Wallet className={`w-5 h-5 ${
                    isSufficient ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Solde disponible</p>
                  <p className="text-xl font-bold">{formatCurrency(walletBalance, 'CDF')}</p>
                </div>
              </div>
              <Badge variant={isSufficient ? 'default' : 'destructive'} className="gap-1">
                {isSufficient ? (
                  <><CheckCircle className="w-3 h-3" /> Suffisant</>
                ) : (
                  <><XCircle className="w-3 h-3" /> Insuffisant</>
                )}
              </Badge>
            </div>
          </motion.div>

          <Separator />

          {/* Récapitulatif */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Récapitulatif</h3>
            
            <div className="space-y-2 bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{formatCurrency(total, 'CDF')}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total, 'CDF')}</span>
              </div>
            </div>

            {/* Message si insuffisant */}
            {!isSufficient && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <p className="text-sm text-red-600">
                  ⚠️ Solde insuffisant. Veuillez recharger votre compte KwendaPay.
                </p>
                <p className="text-xs text-red-600/80 mt-1">
                  Manquant: {formatCurrency(total - walletBalance, 'CDF')}
                </p>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isSufficient || isProcessing}
              className="flex-1 gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Payer avec KwendaPay
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
