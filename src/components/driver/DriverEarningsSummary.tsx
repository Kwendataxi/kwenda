import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Wallet, Calculator } from 'lucide-react';
import { useDriverFinancialSummary } from '@/hooks/useDriverFinancialSummary';

export const DriverEarningsSummary: React.FC = () => {
  const { loading, summary, range, setRange } = useDriverFinancialSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateKwendaFees = () => {
    // Estimation basée sur un taux moyen de 15% (10% admin + 5% plateforme)
    return summary.totalEarningsGross * 0.15;
  };

  const calculatePartnerFees = () => {
    // Estimation basée sur un taux moyen de 2% sur les gains bruts
    return summary.totalEarningsGross * 0.02;
  };

  const totalFees = calculateKwendaFees() + calculatePartnerFees();
  const netAfterFees = summary.totalEarningsGross - totalFees;
  const feesPercentage = summary.totalEarningsGross > 0 ? (totalFees / summary.totalEarningsGross) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex space-x-2">
        {(['7d', '30d', 'all'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setRange(period)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              range === period 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : 'Tout'}
          </button>
        ))}
      </div>

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Revenus Bruts</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(summary.totalEarningsGross)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Frais</p>
                <p className="text-lg font-bold text-red-600">
                  -{formatCurrency(totalFees)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {feesPercentage.toFixed(1)}% des revenus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Revenus Nets</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(netAfterFees)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {summary.roi && summary.roi > 1 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className={`text-lg font-bold ${summary.roi && summary.roi > 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.roi ? `${(summary.roi * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Répartition Détaillée des Frais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fees Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Frais Kwenda (Admin + Plateforme)</span>
              <div className="text-right">
                <span className="font-medium text-red-600">
                  -{formatCurrency(calculateKwendaFees())}
                </span>
                <Badge variant="secondary" className="ml-2">15%</Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Frais Partenaire (estimé)</span>
              <div className="text-right">
                <span className="font-medium text-orange-600">
                  -{formatCurrency(calculatePartnerFees())}
                </span>
                <Badge variant="secondary" className="ml-2">≤2.5%</Badge>
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Frais</span>
                <span className="font-bold text-red-600">
                  -{formatCurrency(totalFees)}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Revenus conservés</span>
              <span>{(100 - feesPercentage).toFixed(1)}%</span>
            </div>
            <Progress 
              value={100 - feesPercentage} 
              className="h-2" 
            />
          </div>

          {/* Investment Analysis */}
          {summary.totalSpent > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Analyse d'Investissement</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Recharges effectuées:</span>
                  <p className="font-medium">{formatCurrency(summary.totalSpent)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gains nets générés:</span>
                  <p className="font-medium">{formatCurrency(summary.totalEarningsNet)}</p>
                </div>
              </div>
              {summary.roi && (
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    Vous avez {summary.roi > 1 ? 'gagné' : 'perdu'} {' '}
                    <span className={`font-medium ${summary.roi > 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(summary.totalEarningsNet - summary.totalSpent))}
                    </span>
                    {' '}par rapport à vos investissements
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">💡 Conseils pour optimiser vos revenus</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• Travaillez pendant les heures de pointe pour bénéficier du surge pricing</li>
                <li>• Maintenez une note élevée pour accéder aux meilleures courses</li>
                <li>• Négociez avec votre partenaire pour réduire le taux de commission</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};