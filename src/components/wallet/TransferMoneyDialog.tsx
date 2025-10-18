import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/hooks/useWallet';
import { useRecipientValidation } from '@/hooks/useRecipientValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Send, 
  X, 
  User, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransferMoneyDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TransferMoneyDialog = ({ open, onClose }: TransferMoneyDialogProps) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { wallet, loading, transferFunds } = useWallet();
  const { recipientInfo, isValidating, error, validateRecipient, clearValidation } = useRecipientValidation();

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    if (value.trim().length >= 3) {
      validateRecipient(value);
    } else {
      clearValidation();
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !recipientInfo?.valid) return;
    
    try {
      await transferFunds(recipient, parseFloat(amount), description);
      setRecipient('');
      setAmount('');
      setDescription('');
      clearValidation();
      onClose();
    } catch (error) {
      console.error('Erreur transfert:', error);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setDescription('');
    clearValidation();
    onClose();
  };

  const isValid = 
    recipient.trim() !== '' && 
    recipientInfo?.valid === true &&
    parseFloat(amount) >= 100 && 
    parseFloat(amount) <= 500000;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "w-[calc(100vw-2rem)] max-w-[500px] p-0 gap-0",
        "max-h-[90vh] overflow-y-auto",
        "bg-white dark:bg-zinc-900",
        "rounded-3xl shadow-2xl border-zinc-200 dark:border-zinc-800"
      )}>
        <DialogHeader className="relative px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-red-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
              Transférer de l'argent
            </DialogTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="absolute right-4 top-4 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Carte solde */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Solde disponible
              </p>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {wallet?.balance.toLocaleString()} CDF
            </p>
          </div>

          {/* Alert info */}
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              Seul votre solde principal est transférable (pas les crédits écosystème).
            </AlertDescription>
          </Alert>

          {/* Input destinataire avec validation */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
              <User className="w-4 h-4" />
              Destinataire
            </Label>
            
            <div className="relative">
              <Input
                placeholder="Numéro de téléphone ou email"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className={cn(
                  "h-12 pl-4 pr-10 rounded-xl",
                  "bg-white dark:bg-zinc-900",
                  "border-2 transition-colors",
                  recipientInfo?.valid && "border-green-500 dark:border-green-600",
                  error && "border-red-500 dark:border-red-600"
                )}
              />
              
              {/* Indicateur de validation */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidating && <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
                {recipientInfo?.valid && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {error && !isValidating && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
            
            {/* Carte destinataire validé */}
            <AnimatePresence>
              {recipientInfo?.valid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 truncate">
                      {recipientInfo.display_name}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {recipientInfo.phone_number}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Message d'erreur */}
            <AnimatePresence>
              {error && !isValidating && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Entrez le numéro de téléphone ou l'email du destinataire Kwenda
            </p>
          </div>

          {/* Input montant */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
              <CreditCard className="w-4 h-4" />
              Montant (CDF)
            </Label>
            
            <Input
              type="number"
              inputMode="numeric"
              placeholder="2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-xl font-bold text-center rounded-xl bg-white dark:bg-zinc-900"
            />
            
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Minimum: 100 CDF</span>
              <span>Maximum: 500,000 CDF</span>
            </div>
          </div>

          {/* Input description */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 font-semibold">
              Description (optionnel)
            </Label>
            <Input
              placeholder="Ex: Remboursement, Cadeau..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl bg-white dark:bg-zinc-900"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-semibold border-2"
            >
              Annuler
            </Button>
            
            <Button
              onClick={handleTransfer}
              disabled={loading || !isValid}
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold",
                "bg-red-500 hover:bg-red-600 text-white",
                "shadow-lg shadow-red-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Transfert...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
