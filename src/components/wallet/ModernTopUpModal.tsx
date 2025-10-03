import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ArrowRight, Check, Loader2 } from 'lucide-react';
import { OperatorSelector } from './OperatorSelector';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { SuccessConfetti } from './SuccessConfetti';
import { toast } from 'sonner';

interface ModernTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  userType?: 'client' | 'driver' | 'partner' | 'admin';
  initialAmount?: number;
  currency?: 'CDF' | 'XOF';
  targetUserId?: string;
}

const QUICK_AMOUNTS = {
  CDF: [5000, 10000, 25000, 50000, 100000],
  XOF: [2000, 5000, 10000, 25000, 50000]
};

export const ModernTopUpModal: React.FC<ModernTopUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userType = 'client',
  initialAmount,
  currency = 'CDF',
  targetUserId
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { validateAmount, validatePhone, amountError, phoneError, clearErrors } = useWalletValidation();

  const handleAmountNext = () => {
    const validation = validateAmount(amount);
    if (validation.isValid) {
      setStep(2);
    }
  };

  const handleOperatorNext = () => {
    if (selectedOperator) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    const phoneValidation = validatePhone(phoneNumber);
    if (!phoneValidation.isValid) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess(parseFloat(amount));
        handleClose();
      }, 3000);
    } catch (error) {
      toast.error('Erreur lors de la recharge');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setSelectedOperator('');
    setPhoneNumber('');
    setSuccess(false);
    clearErrors();
    onClose();
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Zap className="h-6 w-6 text-primary" />
              Recharger mon compte
            </DialogTitle>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-primary-light to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </motion.div>
                <span className="text-sm font-medium">
                  {s === 1 ? 'Montant' : s === 2 ? 'Opérateur' : 'Confirmation'}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Amount */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant à recharger</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg h-14"
                  />
                  {amountError && (
                    <p className="text-sm text-destructive">{amountError}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {QUICK_AMOUNTS[currency].map((quickAmount) => (
                    <motion.button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        amount === quickAmount.toString()
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <p className="text-lg font-bold">{quickAmount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{currency}</p>
                    </motion.button>
                  ))}
                </div>

                <Button
                  onClick={handleAmountNext}
                  className="w-full h-12"
                  disabled={!amount || !!amountError}
                >
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Operator */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label>Choisissez votre opérateur</Label>
                  <OperatorSelector
                    selected={selectedOperator}
                    onSelect={setSelectedOperator}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleOperatorNext}
                    className="flex-1"
                    disabled={!selectedOperator}
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-muted/50 p-6 rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="font-bold">{parseFloat(amount).toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opérateur:</span>
                    <span className="font-bold capitalize">{selectedOperator}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: 0812345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-lg h-14"
                  />
                  {phoneError && (
                    <p className="text-sm text-destructive">{phoneError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={!phoneNumber || !!phoneError || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      'Confirmer'
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <SuccessConfetti show={success} />
    </>
  );
};
