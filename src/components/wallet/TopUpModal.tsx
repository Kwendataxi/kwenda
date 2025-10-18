import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { QuickAmountSelector } from './QuickAmountSelector';
import { OperatorSelector } from './OperatorSelector';
import { AnimatedTopUpButton } from './AnimatedTopUpButton';
import { cn } from '@/lib/utils';

type Operator = 'airtel' | 'orange' | 'mpesa';

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currency?: string;
  quickAmounts?: number[];
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  open,
  onClose,
  onSuccess,
  currency = 'CDF',
  quickAmounts = [1000, 2500, 5000, 10000, 25000]
}) => {
  const { topUpWallet, loading } = useWallet();
  const { triggerSuccess, triggerError } = useHapticFeedback();
  const { validateAmount, validatePhone, amountError, phoneError, clearErrors } = useWalletValidation();
  
  const [amount, setAmount] = useState<string>('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [provider, setProvider] = useState<Operator | ''>('');
  const [phone, setPhone] = useState<string>('');

  const handleQuickAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setSelectedQuickAmount(quickAmount);
    validateAmount(quickAmount.toString());
    triggerSuccess();
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setSelectedQuickAmount(null);
    validateAmount(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    validatePhone(value);
  };

  const handleTopUp = async () => {
    if (!provider) {
      triggerError();
      return;
    }

    const amountValidation = validateAmount(amount);
    const phoneValidation = validatePhone(phone);

    if (!amountValidation.isValid || !phoneValidation.isValid) {
      triggerError();
      return;
    }

    const success = await topUpWallet(Number(amount), provider, phone);
    
    if (success) {
      triggerSuccess();
      resetForm();
      onSuccess?.();
      onClose();
    } else {
      triggerError();
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedQuickAmount(null);
    setProvider('');
    setPhone('');
    clearErrors();
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md p-0 gap-0 overflow-hidden",
        "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50",
        "dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900",
        "border-2 border-primary/20"
      )}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* Header avec gradient */}
          <DialogHeader className="relative p-6 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent relative z-10">
              Recharger KwendaPay
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1 relative z-10">
              Rechargez votre portefeuille via Mobile Money
            </p>
          </DialogHeader>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Quick Amount Selector */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <QuickAmountSelector
                amounts={quickAmounts}
                selectedAmount={selectedQuickAmount}
                onSelect={handleQuickAmountSelect}
                currency={currency}
              />
            </motion.div>

            {/* Custom Amount Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <Label className="text-foreground/90">Montant personnalisé</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Entrez un montant (500 - 1,000,000 CDF)"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={cn(
                  "bg-background/60 backdrop-blur-sm border-2 transition-all",
                  amountError ? 'border-destructive focus-visible:ring-destructive' : 'border-border/50 focus-visible:border-primary'
                )}
              />
              <AnimatePresence>
                {amountError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-destructive font-medium"
                  >
                    {amountError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Operator Selector */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <OperatorSelector
                selected={provider}
                onSelect={(op) => {
                  setProvider(op);
                  triggerSuccess();
                }}
              />
            </motion.div>

            {/* Phone Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-2"
            >
              <Label className="text-foreground/90">Numéro de téléphone</Label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="0991234567"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={cn(
                  "bg-background/60 backdrop-blur-sm border-2 transition-all",
                  phoneError ? 'border-destructive focus-visible:ring-destructive' : 'border-border/50 focus-visible:border-primary'
                )}
              />
              <AnimatePresence>
                {phoneError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-destructive font-medium"
                  >
                    {phoneError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2"
            >
              <AnimatedTopUpButton
                onClick={handleTopUp}
                disabled={!amount || !provider || !phone || loading}
                loading={loading}
              />
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
