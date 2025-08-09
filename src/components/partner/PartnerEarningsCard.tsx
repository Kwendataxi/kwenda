import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Wallet, Calculator } from 'lucide-react';
import { usePartnerEarnings } from '@/hooks/usePartnerEarnings';

interface PartnerEarningsCardProps {
  range?: '7d' | '30d' | 'all';
}

export const PartnerEarningsCard: React.FC<PartnerEarningsCardProps> = ({ range = '30d' }) => {
  const { loading, data } = usePartnerEarnings(range);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRangeLabel = () => {
    switch (range) {
      case '7d': return '7 derniers jours';
      case '30d': return '30 derniers jours';
      case 'all': return 'Depuis le début';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totals = data?.totals;
  const roiPercentage = totals?.roi ? (totals.roi * 100) : 0;
  const isPositiveROI = roiPercentage > 0;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Résumé Financier</span>
          <Badge variant="secondary">{getRangeLabel()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gains vs Rechargé */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">Commissions Gagnées</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totals?.totalPartnerCommission || 0)}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-medium text-muted-foreground">Montant Rechargé</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totals?.totalTopups || 0)}
            </p>
          </div>
        </div>

        {/* ROI */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <p className="text-sm font-medium">Retour sur Investissement (ROI)</p>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className={`h-4 w-4 ${isPositiveROI ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-lg font-bold ${isPositiveROI ? 'text-green-600' : 'text-red-600'}`}>
                {roiPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isPositiveROI 
              ? `Vous avez gagné ${roiPercentage.toFixed(1)}% de plus que vos recharges`
              : totals?.totalTopups && totals.totalTopups > 0 
                ? `Vous devez encore gagner ${formatCurrency((totals.totalTopups - (totals?.totalPartnerCommission || 0)))} pour être rentable`
                : 'Aucune recharge effectuée'
            }
          </p>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
            <p className="text-xl font-semibold">{totals?.totalAssignments || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Revenus Total</p>
            <p className="text-xl font-semibold">{formatCurrency(totals?.totalBookingAmount || 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};