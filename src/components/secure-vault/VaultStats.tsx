import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Clock, CheckCircle } from 'lucide-react';

interface WalletInfo {
  balance: number;
  currency: string;
  pending_withdrawals: number;
  total_earned: number;
  total_withdrawn: number;
}

interface VaultStatsProps {
  walletInfo: WalletInfo | null;
}

export const VaultStats: React.FC<VaultStatsProps> = ({ walletInfo }) => {
  if (!walletInfo) return null;

  const securityLevel = walletInfo.balance > 50000 ? 'Premium' : walletInfo.balance > 10000 ? 'Standard' : 'Basic';
  const gainPercentage = walletInfo.total_withdrawn > 0 
    ? ((walletInfo.total_earned - walletInfo.total_withdrawn) / walletInfo.total_earned * 100).toFixed(1)
    : '100.0';

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Niveau de sécurité</CardTitle>
          <Shield className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{securityLevel}</div>
          <p className="text-xs text-muted-foreground">
            Protection maximale KwendaPay
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de rétention</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{gainPercentage}%</div>
          <p className="text-xs text-muted-foreground">
            Fonds conservés en sécurité
          </p>
        </CardContent>
      </Card>

      <Card className="border-warning/20 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">24h</div>
          <p className="text-xs text-muted-foreground">
            Libération des fonds
          </p>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">100%</div>
          <p className="text-xs text-muted-foreground">
            Taux de réussite
          </p>
        </CardContent>
      </Card>
    </div>
  );
};