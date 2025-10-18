import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { EnhancedWalletCard } from '@/components/wallet/EnhancedWalletCard';
import { QuickAmountSelector } from '@/components/wallet/QuickAmountSelector';
import { OperatorSelector } from '@/components/wallet/OperatorSelector';
import { AnimatedTopUpButton } from '@/components/wallet/AnimatedTopUpButton';
import { TransactionCard } from '@/components/wallet/TransactionCard';
import { EmptyTransactions } from '@/components/wallet/EmptyTransactions';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { WalletSkeleton } from '@/components/wallet/WalletSkeleton';
import { TransferMoneyDialog } from '@/components/wallet/TransferMoneyDialog';
import { Send } from 'lucide-react';

type Operator = 'airtel' | 'orange' | 'mpesa';

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];

export const DriverWalletPanel: React.FC = () => {
  const { wallet, transactions, loading, error, topUpWallet } = useWallet();
  const { triggerSuccess, triggerError } = useHapticFeedback();
  const { validateAmount, validatePhone, amountError, phoneError } = useWalletValidation();
  
  const [amount, setAmount] = useState<string>('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [provider, setProvider] = useState<Operator | ''>('');
  const [phone, setPhone] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const handleQuickAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setSelectedQuickAmount(quickAmount);
    validateAmount(quickAmount.toString());
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

  const handleTopup = async () => {
    if (!provider) return;

    const amountValidation = validateAmount(amount);
    const phoneValidation = validatePhone(phone);

    if (!amountValidation.isValid || !phoneValidation.isValid) {
      triggerError();
      return;
    }

    const success = await topUpWallet(Number(amount), provider, phone);
    
    if (success) {
      triggerSuccess();
      setShowConfetti(true);
      setAmount('');
      setSelectedQuickAmount(null);
      setProvider('');
      setPhone('');
    } else {
      triggerError();
    }
  };

  if (loading) {
    return <WalletSkeleton />;
  }

  return (
    <div className="space-y-6">
      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Enhanced Wallet Balance Card */}
      <div className="space-y-3">
        <EnhancedWalletCard
          balance={wallet?.balance || 0}
          currency={wallet?.currency || 'CDF'}
          loading={loading}
          compact={false}
        />
        
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => setShowTransferDialog(true)}
        >
          <Send className="w-4 h-4" />
          Transférer de l'argent
        </Button>
      </div>

      {/* Modern Top-up Section */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-xl">Recharger mon compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Quick Amount Selector */}
          <QuickAmountSelector
            amounts={QUICK_AMOUNTS}
            selectedAmount={selectedQuickAmount}
            onSelect={handleQuickAmountSelect}
            currency={wallet?.currency || 'CDF'}
          />

          {/* Custom Amount Input */}
          <div className="space-y-2">
            <Label>Montant personnalisé</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Entrez un montant"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={amountError ? 'border-destructive' : ''}
            />
            {amountError && (
              <p className="text-xs text-destructive">{amountError}</p>
            )}
          </div>

          {/* Operator Selector */}
          <OperatorSelector
            selected={provider}
            onSelect={(op) => setProvider(op)}
          />

          {/* Phone Input */}
          <div className="space-y-2">
            <Label>Numéro de téléphone</Label>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="0991234567"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={phoneError ? 'border-destructive' : ''}
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
          </div>

          {/* Animated Top-up Button */}
          <AnimatedTopUpButton
            onClick={handleTopup}
            disabled={!amount || !provider || !phone || loading}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyTransactions />
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction, index) => (
                <TransactionCard
                  key={transaction.id}
                  id={transaction.id}
                  type={transaction.transaction_type as 'credit' | 'debit'}
                  amount={Number(transaction.amount)}
                  currency={transaction.currency}
                  description={transaction.description}
                  date={transaction.created_at}
                  index={index}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransferMoneyDialog 
        open={showTransferDialog} 
        onClose={() => setShowTransferDialog(false)} 
      />
    </div>
  );
};

export default DriverWalletPanel;
