/**
 * 💸 Modal de retrait KwendaPay
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Banknote, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onSuccess: () => void;
}

const WITHDRAW_PROVIDERS = [
  { id: 'airtel', name: 'Airtel Money', logo: '📱', fee: 2 },
  { id: 'orange', name: 'Orange Money', logo: '🟠', fee: 2 },
  { id: 'mpesa', name: 'M-Pesa', logo: '💚', fee: 2 }
];

const MIN_WITHDRAW = 5000;
const MAX_WITHDRAW = 1000000;

export const WithdrawModal = ({ open, onOpenChange, currentBalance, onSuccess }: WithdrawModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('airtel');
  const [phoneNumber, setPhoneNumber] = useState('');

  const selectedProvider = WITHDRAW_PROVIDERS.find(p => p.id === provider);
  const parsedAmount = parseInt(amount) || 0;
  const fee = Math.ceil(parsedAmount * (selectedProvider?.fee || 0) / 100);
  const total = parsedAmount + fee;

  const handleWithdraw = async () => {
    if (parsedAmount < MIN_WITHDRAW) {
      toast({
        title: "Montant trop faible",
        description: `Le montant minimum de retrait est de ${MIN_WITHDRAW.toLocaleString()} CDF`,
        variant: "destructive"
      });
      return;
    }

    if (total > currentBalance) {
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
      // Pour l'instant, on simule la création de la demande de retrait
      // Une edge function complète sera créée plus tard
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Retrait en cours",
        description: "Votre demande de retrait est en cours de traitement",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setAmount('');
      setPhoneNumber('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Retirer mes fonds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Solde disponible */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Solde disponible: <strong>{currentBalance.toLocaleString()} CDF</strong>
            </AlertDescription>
          </Alert>

          {/* Montant */}
          <div className="space-y-3">
            <Label>Montant à retirer (CDF)</Label>
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
              Minimum: {MIN_WITHDRAW.toLocaleString()} CDF
            </p>
          </div>

          {/* Provider */}
          <div className="space-y-3">
            <Label>Moyen de retrait</Label>
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
                <span className="font-medium">{parsedAmount.toLocaleString()} CDF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais ({selectedProvider?.fee}%)</span>
                <span className="font-medium">{fee.toLocaleString()} CDF</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-semibold">Total débité</span>
                <span className="font-bold text-primary">{total.toLocaleString()} CDF</span>
              </div>
            </motion.div>
          )}
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
            disabled={loading || total > currentBalance}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4 mr-2" />
                Retirer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
