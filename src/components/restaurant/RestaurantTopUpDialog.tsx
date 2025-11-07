import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';

interface RestaurantTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onSuccess: () => void;
  onTopUp: (amount: number, method: string, phone: string) => Promise<void>;
  loading?: boolean;
}

const SUGGESTED_AMOUNTS = [
  { label: '10k FC', value: 10000 },
  { label: '25k FC', value: 25000 },
  { label: '50k FC', value: 50000 },
  { label: '100k FC', value: 100000 },
];

export const RestaurantTopUpDialog: React.FC<RestaurantTopUpDialogProps> = ({
  open,
  onOpenChange,
  currentBalance,
  onSuccess,
  onTopUp,
  loading = false
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'm_pesa' | 'airtel_money'>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handleContinue = () => {
    const amountNum = parseInt(amount);
    
    if (!amountNum || amountNum < 5000) {
      toast({
        title: "Montant invalide",
        description: "Le montant minimum est 5 000 FC",
        variant: "destructive"
      });
      return;
    }

    if (amountNum > 500000) {
      toast({
        title: "Montant trop élevé",
        description: "Le montant maximum est 500 000 FC",
        variant: "destructive"
      });
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    try {
      await onTopUp(parseInt(amount), paymentMethod, phoneNumber);
      setShowConfetti(true);
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      // Error already handled in parent
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setPhoneNumber('');
    setShowConfetti(false);
    onOpenChange(false);
  };

  const fees = parseInt(amount) * 0.02;
  const total = parseInt(amount) || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recharger mon wallet</DialogTitle>
            <DialogDescription>
              Solde actuel: <span className="font-bold text-foreground">{currentBalance.toLocaleString()} FC</span>
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Montant */}
                <div className="space-y-2">
                  <Label>Montant à recharger</Label>
                  <Input
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={5000}
                    max={500000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Min: 5 000 FC • Max: 500 000 FC
                  </p>
                </div>

                {/* Suggestions */}
                <div className="grid grid-cols-4 gap-2">
                  {SUGGESTED_AMOUNTS.map((suggested) => (
                    <Button
                      key={suggested.value}
                      variant={amount === suggested.value.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAmountSelect(suggested.value)}
                      className="text-xs"
                    >
                      {suggested.label}
                    </Button>
                  ))}
                </div>

                <Button onClick={handleContinue} className="w-full" size="lg">
                  Continuer
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Récapitulatif */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Montant</span>
                    <span className="font-bold">{parseInt(amount).toLocaleString()} FC</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Frais (2%)</span>
                    <span>{fees.toLocaleString()} FC</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{total.toLocaleString()} FC</span>
                  </div>
                </div>

                {/* Méthode de paiement */}
                <div className="space-y-2">
                  <Label>Méthode de paiement</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="orange_money" id="orange" />
                      <Label htmlFor="orange" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-4 w-4 text-orange-500" />
                        <span>Orange Money</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="m_pesa" id="mpesa" />
                      <Label htmlFor="mpesa" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-4 w-4 text-green-500" />
                        <span>M-Pesa</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="airtel_money" id="airtel" />
                      <Label htmlFor="airtel" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-4 w-4 text-red-500" />
                        <span>Airtel Money</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Numéro de téléphone */}
                <div className="space-y-2">
                  <Label>Numéro de téléphone</Label>
                  <Input
                    type="tel"
                    placeholder="Ex: 0812345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entrez le numéro associé à votre compte Mobile Money
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirmer le paiement
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <SuccessConfetti show={showConfetti} />
    </>
  );
};
