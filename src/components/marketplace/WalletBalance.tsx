import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Wallet, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { formatCurrency } from '@/lib/utils';

interface WalletBalanceProps {
  balance: number;
  currency: string;
  onTopUp?: () => void;
  compact?: boolean;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  balance,
  currency = 'CDF',
  onTopUp,
  compact = false
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">KwendaPay</p>
            <p className="font-bold text-sm text-foreground">
              {formatCurrency(balance, currency)}
            </p>
          </div>
        </div>
        {onTopUp && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 px-3 text-xs rounded-lg"
            onClick={onTopUp}
          >
            <Plus className="w-3 h-3 mr-1" />
            Recharger
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary to-primary-light text-white border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Mon KwendaPay</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {formatCurrency(balance, currency)}
              </p>
              <p className="text-xs opacity-75">Solde disponible</p>
            </div>
          </div>
          {onTopUp && (
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              onClick={onTopUp}
            >
              <Plus className="w-4 h-4 mr-2" />
              Recharger
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};