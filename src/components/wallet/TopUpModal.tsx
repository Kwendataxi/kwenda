import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone } from 'lucide-react';
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
        "w-[calc(100vw-2rem)] max-w-[480px] p-0 gap-0 overflow-hidden",
        "max-h-[90vh] overflow-y-auto",
        "bg-zinc-900/98 dark:bg-zinc-900/98",
        "backdrop-blur-xl border-zinc-800/50",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4",
        "data-[state=open]:duration-300"
      )}>
        {/* Header simplifié */}
        <DialogHeader className="relative p-5 sm:p-6 pb-4 border-b border-zinc-800/50">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
            Rechargez votre portefeuille via Mobile Money
          </DialogTitle>
        </DialogHeader>

        {/* Content avec espacements généreux */}
        <div className="p-5 sm:p-6 space-y-6 sm:space-y-7">
          {/* Quick Amount Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
          >
            <QuickAmountSelector
              amounts={quickAmounts}
              selectedAmount={selectedQuickAmount}
              onSelect={handleQuickAmountSelect}
              currency={currency}
            />
          </motion.div>

          {/* Custom Amount Input - Grande taille */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-3"
          >
            <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
              Montant personnalisé
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="2500"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                "h-16 sm:h-20 text-2xl sm:text-3xl font-bold text-center",
                "bg-zinc-800/50 border-2 border-zinc-700/50",
                "text-white placeholder:text-zinc-600",
                "rounded-2xl",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                amountError && "border-rose-500 focus-visible:ring-rose-500/20"
              )}
            />
            <AnimatePresence>
              {amountError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-rose-400 font-medium text-center"
                >
                  {amountError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Operator Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
          >
            <OperatorSelector
              selected={provider}
              onSelect={(op) => {
                setProvider(op);
                triggerSuccess();
              }}
            />
          </motion.div>

          {/* Phone Input - Grande taille */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-3"
          >
            <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
              Numéro de téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                type="tel"
                inputMode="tel"
                placeholder="0991234567"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={cn(
                  "h-14 sm:h-16 text-base sm:text-lg pl-12",
                  "bg-zinc-800/50 border-2 border-zinc-700/50",
                  "text-white placeholder:text-zinc-600",
                  "rounded-2xl",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  phoneError && "border-rose-500 focus-visible:ring-rose-500/20"
                )}
              />
            </div>
            <AnimatePresence>
              {phoneError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-rose-400 font-medium"
                >
                  {phoneError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            <AnimatedTopUpButton
              onClick={handleTopUp}
              disabled={!amount || !provider || !phone || loading}
              loading={loading}
            />
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
