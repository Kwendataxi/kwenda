import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QuickAmountSelector } from './QuickAmountSelector';
import { OperatorSelector } from './OperatorSelector';
import { cn } from '@/lib/utils';

type Operator = 'airtel' | 'orange' | 'mpesa';
type UserType = 'client' | 'partner' | 'vendor' | 'restaurant';

interface UnifiedTopUpModalProps {
  open: boolean;
  onClose: () => void;
  userType: UserType;
  walletBalance: number;
  currency?: string;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS: Record<UserType, number[]> = {
  client: [1000, 2500, 5000, 10000, 25000],
  restaurant: [5000, 10000, 25000, 50000, 100000],
  partner: [25000, 50000, 100000, 250000, 500000],
  vendor: [10000, 25000, 50000, 100000, 200000]
};

const ORDER_TYPES: Record<UserType, string> = {
  client: 'wallet_topup',
  restaurant: 'wallet_topup',
  partner: 'partner_credit',
  vendor: 'vendor_credit'
};

export const UnifiedTopUpModal: React.FC<UnifiedTopUpModalProps> = ({
  open,
  onClose,
  userType,
  walletBalance,
  currency = 'CDF',
  onSuccess
}) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [provider, setProvider] = useState<Operator | ''>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  const quickAmounts = QUICK_AMOUNTS[userType];

  const handleQuickAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setSelectedQuickAmount(quickAmount);
    setAmountError('');
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setSelectedQuickAmount(null);
    
    const numAmount = Number(value);
    if (!value || isNaN(numAmount)) {
      setAmountError('Montant invalide');
    } else if (numAmount < 500) {
      setAmountError('Montant minimum : 500 CDF');
    } else if (numAmount > 500000) {
      setAmountError('Montant maximum : 500,000 CDF');
    } else if (provider === 'orange' && numAmount % 100 !== 0) {
      setAmountError('Orange Money : montant doit être multiple de 100');
    } else {
      setAmountError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    
    if (!value) {
      setPhoneError('');
      return;
    }
    
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    
    // Format DRC : +243XXXXXXXXX ou 0XXXXXXXXX
    const phoneWithPrefixRegex = /^\+?243[0-9]{9}$/;
    const phoneWithoutPrefixRegex = /^0[0-9]{9}$/;
    
    if (!phoneWithPrefixRegex.test(cleanPhone) && !phoneWithoutPrefixRegex.test(cleanPhone)) {
      setPhoneError('Format invalide. Ex: +243991234567 ou 0991234567');
    } else if (provider === 'orange' && !cleanPhone.match(/^(\+?243|0)(81|82|83|84|85|89|97|98)[0-9]{7}$/)) {
      setPhoneError('Orange Money : numéro invalide (doit commencer par 81, 82, 83, 84, 85, 89, 97 ou 98)');
    } else if (provider === 'airtel' && !cleanPhone.match(/^(\+?243|0)(97|99)[0-9]{7}$/)) {
      setPhoneError('Airtel Money : numéro invalide (doit commencer par 97 ou 99)');
    } else {
      setPhoneError('');
    }
  };

  const handleTopUp = async () => {
    if (!provider) {
      toast.error('Veuillez sélectionner un opérateur');
      return;
    }

    if (!amount || Number(amount) < 500) {
      setAmountError('Montant minimum : 500 CDF');
      return;
    }

    if (!phone) {
      setPhoneError('Numéro de téléphone requis');
      return;
    }

    if (amountError || phoneError) return;

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
        body: {
          amount: Number(amount),
          provider,
          phoneNumber: phone,
          currency,
          orderType: ORDER_TYPES[userType],
          userType
        }
      });

      if (error) throw error;

      if (data?.payment_url) {
        toast.success('Redirection vers Orange Money...', {
          description: 'Complétez le paiement sur votre téléphone'
        });
        
        // Redirection vers Orange Money
        window.location.href = data.payment_url;
      } else {
        toast.success(`Rechargement de ${Number(amount).toLocaleString()} ${currency} initié !`);
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Error topping up:', error);
      toast.error(error.message || 'Erreur lors du rechargement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedQuickAmount(null);
    setProvider('');
    setPhone('');
    setAmountError('');
    setPhoneError('');
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-[calc(100vw-2rem)] max-w-[480px] p-0 gap-0 overflow-hidden",
        "max-h-[90vh] overflow-y-auto",
        "bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800",
        "backdrop-blur-xl border-2 border-zinc-700/50 shadow-2xl"
      )}>
        <DialogHeader className="relative p-5 sm:p-6 pb-4 border-b border-zinc-700/50 bg-gradient-to-r from-zinc-800 to-zinc-900">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
            Rechargez votre portefeuille
          </DialogTitle>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 flex-wrap"
          >
            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <p className="text-xs font-medium text-white/90">
                Solde actuel : {walletBalance.toLocaleString()} {currency}
              </p>
            </div>
          </motion.div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Montants rapides */}
          <div>
            <Label className="text-sm font-semibold text-white mb-3 block">
              Montants suggérés
            </Label>
            <QuickAmountSelector
              amounts={quickAmounts}
              selectedAmount={selectedQuickAmount}
              onSelect={handleQuickAmountSelect}
              currency={currency}
            />
          </div>

          {/* Montant personnalisé */}
          <div>
            <Label htmlFor="custom-amount" className="text-sm font-semibold text-white mb-2 block">
              Montant personnalisé
            </Label>
            <Input
              id="custom-amount"
              type="number"
              placeholder="Entrez un montant"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-primary"
            />
            {amountError && (
              <p className="text-xs text-red-400 mt-1">{amountError}</p>
            )}
          </div>

          {/* Sélection opérateur */}
          <div>
            <Label className="text-sm font-semibold text-white mb-3 block">
              Opérateur Mobile Money
            </Label>
          <OperatorSelector
            selected={provider}
            onSelect={(op) => setProvider(op as Operator)}
          />
          </div>

          {/* Numéro de téléphone */}
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold text-white mb-2 block">
              Numéro de téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="pl-10 bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-primary"
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-400 mt-1">{phoneError}</p>
            )}
          </div>

          {/* Bouton de confirmation */}
          <Button
            onClick={handleTopUp}
            disabled={loading || !amount || !provider || !phone || !!amountError || !!phoneError}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirmer le rechargement
              </>
            )}
          </Button>

          {/* Info sécurité */}
          <div className="pt-3 border-t border-zinc-700/50">
            <p className="text-xs text-zinc-400 text-center">
              🔒 Paiement sécurisé par Orange Money
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
