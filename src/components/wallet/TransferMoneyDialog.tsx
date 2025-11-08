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

  const amountValue = parseFloat(amount) || 0;
  const isAmountValid = amountValue >= 100 && amountValue <= 500000;
  const isAmountTooLow = amountValue > 0 && amountValue < 100;
  const isAmountTooHigh = amountValue > 500000;
  
  const isValid = 
    recipient.trim() !== '' && 
    recipientInfo?.valid === true &&
    isAmountValid;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "w-[calc(100vw-2rem)] max-w-[500px] p-0 gap-0",
        "max-h-[90vh] overflow-y-auto",
        "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl",
        "rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50",
        "animate-in fade-in-0 zoom-in-95 duration-300",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      )}>
        {/* Loading Overlay avec backdrop */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Transfert en cours...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogHeader className="relative px-6 py-5 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center backdrop-blur-sm border border-primary/20">
              <Send className="w-5 h-5 text-primary animate-bounce-subtle" />
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Transférer de l'argent
            </DialogTitle>
          </motion.div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Carte solde avec glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm bg-gradient-to-br from-primary/10 via-pink-500/10 to-orange-500/10 border border-primary/20 dark:border-primary/20 shadow-lg shadow-primary/10"
          >
            {/* Effet de lumière animé en arrière-plan */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-pink-400/5 animate-pulse-slow" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-primary animate-bounce-subtle" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Solde disponible
                </p>
              </div>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-primary via-pink-600 to-orange-600 bg-clip-text text-transparent">
                {wallet?.balance.toLocaleString()} CDF
              </p>
            </div>
          </motion.div>

          {/* Alert info */}
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              Seul votre solde principal est transférable (pas les crédits écosystème).
            </AlertDescription>
          </Alert>

          {/* Input destinataire avec validation */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
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
                  "h-14 pl-4 pr-12 rounded-2xl text-lg",
                  "bg-zinc-50 dark:bg-zinc-800/50",
                  "border-2 transition-all duration-300",
                  "focus:scale-[1.02] focus:shadow-lg",
                  recipientInfo?.valid && "border-green-500 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20",
                  error && "border-red-500 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20 animate-shake"
                )}
              />
              
              {/* Indicateur de validation */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidating && <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
                {recipientInfo?.valid && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-500 animate-bounce-subtle" />
                  </motion.div>
                )}
                {error && !isValidating && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <XCircle className="w-6 h-6 text-red-500" />
                  </motion.div>
                )}
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
          </motion.div>

          {/* Input montant avec feedback visuel */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
              <CreditCard className="w-4 h-4" />
              Montant (CDF)
            </Label>
            
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="2000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(
                  "h-16 text-2xl font-bold text-center rounded-2xl",
                  "bg-zinc-50 dark:bg-zinc-800/50",
                  "border-2 transition-all duration-300",
                  "focus:scale-[1.02] focus:shadow-lg",
                  isAmountValid && "border-green-500 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20",
                  isAmountTooLow && "border-amber-500 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 animate-shake",
                  isAmountTooHigh && "border-red-500 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20 animate-shake"
                )}
              />
              
              {/* Indicateur visuel du montant */}
              {isAmountValid && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-500 animate-bounce-subtle" />
                </motion.div>
              )}
            </div>
            
            <div className="flex justify-between text-xs">
              <span className={cn(
                "transition-colors",
                isAmountTooLow ? "text-amber-600 dark:text-amber-500 font-semibold" : "text-zinc-500 dark:text-zinc-400"
              )}>
                Minimum: 100 CDF
              </span>
              <span className={cn(
                "transition-colors",
                isAmountTooHigh ? "text-red-600 dark:text-red-500 font-semibold" : "text-zinc-500 dark:text-zinc-400"
              )}>
                Maximum: 500,000 CDF
              </span>
            </div>
            
            {/* Messages de validation du montant */}
            <AnimatePresence>
              {isAmountTooLow && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Le montant minimum est de 100 CDF
                </motion.p>
              )}
              {isAmountTooHigh && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Le montant maximum est de 500,000 CDF par transfert
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Input description */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <Label className="text-zinc-700 dark:text-zinc-300 font-semibold">
              Description (optionnel)
            </Label>
            <Input
              placeholder="Ex: Remboursement, Cadeau..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-2 transition-all duration-300 focus:scale-[1.02]"
            />
          </motion.div>

          {/* Boutons d'action */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 pt-4"
          >
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-14 rounded-2xl font-semibold border-2 hover:scale-[1.02] transition-transform"
            >
              Annuler
            </Button>
            
            <Button
              onClick={handleTransfer}
              disabled={loading || !isValid}
              className={cn(
                "flex-1 h-14 rounded-2xl font-bold text-lg",
                "bg-gradient-to-r from-primary via-pink-500 to-orange-500",
                "hover:from-primary/90 hover:via-pink-600 hover:to-orange-600",
                "text-white shadow-xl shadow-primary/40",
                "transform transition-all duration-300",
                "hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/50",
                "active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                !loading && isValid && "animate-pulse-subtle"
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
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
