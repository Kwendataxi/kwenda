/**
 * 💸 Dialog de demande de retrait pour clients
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Banknote, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

interface WithdrawRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  currency?: string;
  userType?: 'client' | 'driver' | 'vendor' | 'partner';
  onSuccess?: () => void;
}

const WITHDRAW_PROVIDERS = [
  { id: 'airtel_money', name: 'Airtel Money', logo: '📱', fee: 2 },
  { id: 'orange_money', name: 'Orange Money', logo: '🟠', fee: 2 },
  { id: 'm_pesa', name: 'M-Pesa', logo: '💚', fee: 2 }
];

const MIN_WITHDRAW = 5000;
const MAX_WITHDRAW = 1000000;

export const WithdrawRequestDialog = ({ 
  open, 
  onOpenChange, 
  currentBalance, 
  currency = 'CDF',
  userType = 'client',
  onSuccess 
}: WithdrawRequestDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('airtel_money');
  const [phoneNumber, setPhoneNumber] = useState('');

  const selectedProvider = WITHDRAW_PROVIDERS.find(p => p.id === provider);
  const parsedAmount = parseInt(amount) || 0;
  const fee = Math.ceil(parsedAmount * (selectedProvider?.fee || 0) / 100);
  const netAmount = parsedAmount - fee;

  const handleWithdraw = async () => {
    if (parsedAmount < MIN_WITHDRAW) {
      toast({
        title: "Montant trop faible",
        description: `Le montant minimum de retrait est de ${MIN_WITHDRAW.toLocaleString()} ${currency}`,
        variant: "destructive"
      });
      return;
    }

    if (parsedAmount > currentBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Votre solde est insuffisant pour ce retrait",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Appeler l'Edge Function escrow-management
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: {
          action: 'process_withdrawal',
          confirmationData: {
            userId: user.id,
            amount: parsedAmount,
            withdrawalMethod: 'mobile_money',
            paymentDetails: {
              userType,
              mobileMoneyProvider: provider,
              mobileMoneyPhone: `+243${phoneNumber}`
            }
          }
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur lors du retrait');

      setSuccess(true);
      
      toast({
        title: "Demande envoyée",
        description: "Votre demande de retrait est en attente de validation",
      });

      // Attendre un peu avant de fermer pour montrer l'animation
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setSuccess(false);
        setAmount('');
        setPhoneNumber('');
      }, 2000);

    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast({
        title: "Erreur de retrait",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h3 className="text-xl font-semibold text-center">Demande envoyée !</h3>
            <p className="text-muted-foreground text-center">
              Votre demande de retrait de {parsedAmount.toLocaleString()} {currency} est en cours de traitement.
            </p>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Demander un retrait
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Solde disponible */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Solde disponible: <strong>{currentBalance.toLocaleString()} {currency}</strong>
            </AlertDescription>
          </Alert>

          {/* Montant */}
          <div className="space-y-3">
            <Label>Montant à retirer ({currency})</Label>
            <Input
              type="number"
              placeholder="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={MIN_WITHDRAW}
              max={Math.min(currentBalance, MAX_WITHDRAW)}
              step="1000"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: {MIN_WITHDRAW.toLocaleString()} {currency}
            </p>
          </div>

          {/* Provider */}
          <div className="space-y-3">
            <Label>Moyen de réception</Label>
            <RadioGroup value={provider} onValueChange={setProvider}>
              {WITHDRAW_PROVIDERS.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-accent"
                  onClick={() => setProvider(p.id)}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={p.id} id={p.id} />
                    <Label htmlFor={p.id} className="flex items-center gap-2 cursor-pointer">
                      <span className="text-2xl">{p.logo}</span>
                      <span className="font-medium">{p.name}</span>
                    </Label>
                  </div>
                  <span className="text-xs text-muted-foreground">Frais: {p.fee}%</span>
                </motion.div>
              ))}
            </RadioGroup>
          </div>

          {/* Numéro de téléphone */}
          <div className="space-y-3">
            <Label>Numéro de réception</Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 border rounded-l-md bg-muted text-sm">
                +243
              </span>
              <Input
                type="tel"
                placeholder="812345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={9}
                className="rounded-l-none"
              />
            </div>
          </div>

          {/* Résumé */}
          {parsedAmount >= MIN_WITHDRAW && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/50 rounded-lg p-4 space-y-2 border"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant demandé</span>
                <span className="font-medium">{parsedAmount.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais ({selectedProvider?.fee}%)</span>
                <span className="font-medium">-{fee.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-semibold">Vous recevrez</span>
                <span className="font-bold text-green-600">{netAmount.toLocaleString()} {currency}</span>
              </div>
            </motion.div>
          )}

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center">
            ⏳ Les demandes de retrait sont traitées sous 24-48h
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={loading || parsedAmount > currentBalance || parsedAmount < MIN_WITHDRAW}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4 mr-2" />
                Demander
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
