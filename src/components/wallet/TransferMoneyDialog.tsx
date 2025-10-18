import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { Send, User, CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TransferMoneyDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TransferMoneyDialog = ({ open, onClose }: TransferMoneyDialogProps) => {
  const { wallet, transferFunds, loading } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleTransfer = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return;
    }

    const success = await transferFunds(recipient, numAmount, description);
    if (success) {
      setRecipient('');
      setAmount('');
      setDescription('');
      onClose();
    }
  };

  const isValid = recipient.trim() !== '' && amount !== '' && parseFloat(amount) >= 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Transférer de l'argent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Solde disponible */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Solde disponible</span>
              <span className="text-xl font-bold text-primary">
                {wallet?.balance.toLocaleString() || 0} CDF
              </span>
            </div>
          </div>

          {/* Info importante */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Seul votre solde principal est transférable (pas les crédits écosystème).
            </AlertDescription>
          </Alert>

          {/* Destinataire */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Destinataire
            </Label>
            <Input
              id="recipient"
              placeholder="Numéro de téléphone ou email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Entrez le numéro de téléphone ou l'email du destinataire Kwenda
            </p>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Montant (CDF)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Min: 100 - Max: 500,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max="500000"
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: 100 CDF</span>
              <span>Maximum: 500,000 CDF</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              placeholder="Ex: Remboursement, Cadeau..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleTransfer}
              disabled={loading || !isValid}
            >
              <Send className="w-4 h-4" />
              {loading ? 'Transfert...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
