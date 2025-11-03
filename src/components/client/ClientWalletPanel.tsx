import React, { useState } from 'react';
import '@/styles/wallet-theme.css'; // Lazy-loaded: only when wallet features are accessed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { WalletHero } from '@/components/wallet/WalletHero';
import { WalletQuickActions } from '@/components/wallet/WalletQuickActions';
import { QuickAmountSelector } from '@/components/wallet/QuickAmountSelector';
import { OperatorSelector } from '@/components/wallet/OperatorSelector';
import { AnimatedTopUpButton } from '@/components/wallet/AnimatedTopUpButton';
import { TransactionCard } from '@/components/wallet/TransactionCard';
import { EmptyTransactions } from '@/components/wallet/EmptyTransactions';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { WalletSkeleton } from '@/components/wallet/WalletSkeleton';
import { TransferMoneyDialog } from '@/components/wallet/TransferMoneyDialog';
import { PointsConversionDialog } from '@/components/loyalty/PointsConversionDialog';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { Send, Gift, Zap } from 'lucide-react';

type Operator = 'airtel' | 'orange' | 'mpesa';

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

interface ClientWalletPanelProps {
  initialTopUpOpen?: boolean;
  onTopUpModalChange?: (open: boolean) => void;
}

export const ClientWalletPanel: React.FC<ClientWalletPanelProps> = ({ 
  initialTopUpOpen = false,
  onTopUpModalChange 
}) => {
  const { wallet, transactions, loading, error, topUpWallet } = useWallet();
  const { triggerSuccess, triggerError } = useHapticFeedback();
  const { validateAmount, validatePhone, amountError, phoneError } = useWalletValidation();
  
  const [amount, setAmount] = useState<string>('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [provider, setProvider] = useState<Operator | ''>('');
  const [phone, setPhone] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(initialTopUpOpen);

  // Ouvrir le modal si demandé depuis l'extérieur
  React.useEffect(() => {
    if (initialTopUpOpen) {
      setShowTopUpModal(true);
    }
  }, [initialTopUpOpen]);

  // Notifier le parent du changement d'état du modal
  const handleTopUpModalChange = (open: boolean) => {
    setShowTopUpModal(open);
    onTopUpModalChange?.(open);
  };

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

  const handleTopUp = async () => {
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
    <div className="min-h-screen bg-gradient-to-b from-congo-blue/5 to-white dark:from-congo-blue/10 dark:to-background pb-24">
      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Hero moderne et épuré */}
      <WalletHero
        balance={wallet?.balance || 0}
        mainBalance={wallet?.balance || 0}
        bonusBalance={wallet?.ecosystem_credits || 0}
        currency={wallet?.currency || 'CDF'}
        status="active"
      />

      {/* Actions rapides circulaires */}
      <WalletQuickActions 
        onRecharge={() => handleTopUpModalChange(true)}
        onTransfer={() => setShowTransferDialog(true)}
        onConvert={() => setShowConversionDialog(true)}
      />

      {/* Transaction History - Liste propre */}
      <div id="transactions-section" className="px-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Transactions récentes
        </h3>
        
        {transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div className="bg-white dark:bg-card/50 rounded-2xl shadow-sm border border-border/50 dark:border-border/30 divide-y divide-border/30 overflow-hidden">
            {transactions.slice(0, 8).map((transaction, index) => (
              <TransactionCard
                key={transaction.id}
                id={transaction.id}
                type={transaction.transaction_type as 'credit' | 'debit'}
                amount={Number(transaction.amount)}
                currency={transaction.currency}
                description={transaction.description}
                date={transaction.created_at}
                index={index}
                compact={true}
              />
            ))}
          </div>
        )}
      </div>

      <TransferMoneyDialog 
        open={showTransferDialog} 
        onClose={() => setShowTransferDialog(false)} 
      />

      <PointsConversionDialog 
        open={showConversionDialog} 
        onClose={() => setShowConversionDialog(false)} 
      />

      <TopUpModal
        open={showTopUpModal}
        onClose={() => handleTopUpModalChange(false)}
        onSuccess={() => setShowConfetti(true)}
        currency={wallet?.currency || 'CDF'}
        quickAmounts={QUICK_AMOUNTS}
      />
    </div>
  );
};

export default ClientWalletPanel;
