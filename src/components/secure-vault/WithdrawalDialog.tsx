import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Phone, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onSuccess: () => void;
}

export const WithdrawalDialog: React.FC<WithdrawalDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('kwenda_pay');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const withdrawalFees = {
    kwenda_pay: 0, // Gratuit
    mobile_money: 500, // 500 CDF
    bank_transfer: 1000 // 1000 CDF
  };

  const currentFee = withdrawalFees[withdrawalMethod as keyof typeof withdrawalFees] || 0;
  const netAmount = parseFloat(amount) ? parseFloat(amount) - currentFee : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawalAmount = parseFloat(amount);
    
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast({
        title: "💰 Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast({
        title: "💳 Solde insuffisant",
        description: "Le montant dépasse votre solde disponible",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount <= currentFee) {
      toast({
        title: "⚠️ Montant trop faible",
        description: `Le montant doit être supérieur aux frais (${currentFee} CDF)`,
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "📱 Numéro requis",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalMethod === 'mobile_money' && !mobileProvider) {
      toast({
        title: "📞 Opérateur requis",
        description: "Veuillez sélectionner votre opérateur mobile",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase.functions.invoke('secure-vault-management', {
        body: {
          action: 'process_withdrawal',
          confirmationData: {
            userId: user.id,
            amount: withdrawalAmount,
            withdrawalMethod,
            fee: currentFee,
            netAmount,
            paymentDetails: {
              userType: 'vault_user',
              kwendaPayPhone: withdrawalMethod === 'kwenda_pay' ? phoneNumber : null,
              mobileMoneyProvider: withdrawalMethod === 'mobile_money' ? mobileProvider : null,
              mobileMoneyPhone: withdrawalMethod === 'mobile_money' ? phoneNumber : null,
              bankDetails: withdrawalMethod === 'bank_transfer' ? { phone: phoneNumber } : null
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Demande soumise avec succès",
        description: `Votre retrait de ${netAmount.toLocaleString()} CDF est en cours de traitement sécurisé`
      });

      onSuccess();
      resetForm();

    } catch (error: any) {
      console.error('Erreur retrait:', error);
      toast({
        title: "❌ Erreur de traitement",
        description: error.message || "Erreur lors de la demande de retrait",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPhoneNumber('');
    setMobileProvider('');
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'kwenda_pay': return <Wallet className="h-4 w-4" />;
      case 'mobile_money': return <Phone className="h-4 w-4" />;
      case 'bank_transfer': return <CreditCard className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Retrait sécurisé KwendaPay
          </DialogTitle>
          <DialogDescription>
            💰 Solde disponible: <strong>{availableBalance.toLocaleString()} CDF</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Information de sécurité */}
          <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
            <Shield className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-success">Transfert sécurisé</p>
              <p className="text-success/80">
                Fonds protégés par le système de sécurité KwendaPay
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">💰 Montant à retirer (CDF)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Saisir le montant"
              min="1"
              max={availableBalance}
              required
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">🏦 Méthode de retrait</Label>
            <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kwenda_pay">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-success" />
                    <div>
                      <span>KwendaPay</span>
                      <span className="text-xs text-success ml-2">✓ Gratuit</span>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="mobile_money">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <span>Mobile Money</span>
                      <span className="text-xs text-muted-foreground ml-2">500 CDF</span>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-warning" />
                    <div>
                      <span>Virement bancaire</span>
                      <span className="text-xs text-muted-foreground ml-2">1000 CDF</span>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {withdrawalMethod === 'mobile_money' && (
            <div className="space-y-2">
              <Label htmlFor="provider">📞 Opérateur mobile</Label>
              <Select value={mobileProvider} onValueChange={setMobileProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir l'opérateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange_money">🟠 Orange Money</SelectItem>
                  <SelectItem value="airtel_money">🔴 Airtel Money</SelectItem>
                  <SelectItem value="m_pesa">🟢 M-Pesa (Vodacom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">
              📱 {withdrawalMethod === 'kwenda_pay' ? 'Numéro KwendaPay' : 
                   withdrawalMethod === 'mobile_money' ? 'Numéro Mobile Money' : 
                   'Numéro de contact'}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+243 XX XXX XXXX"
              required
            />
          </div>

          {/* Résumé des frais */}
          {parseFloat(amount) > 0 && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
              <div className="flex justify-between text-sm">
                <span>Montant demandé:</span>
                <span className="font-semibold">{parseFloat(amount).toLocaleString()} CDF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frais de traitement:</span>
                <span className={currentFee === 0 ? "text-success font-semibold" : ""}>
                  {currentFee === 0 ? "GRATUIT" : `${currentFee.toLocaleString()} CDF`}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Montant net reçu:</span>
                <span className="text-success">{netAmount.toLocaleString()} CDF</span>
              </div>
            </div>
          )}

          {/* Temps de traitement */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Traitement en 2-24h selon la méthode</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              ❌ Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= currentFee}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Traitement...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {getMethodIcon(withdrawalMethod)}
                  Confirmer le retrait
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};