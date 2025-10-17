import { useState } from 'react';
import { useRestaurantPaymentModel } from '@/hooks/useRestaurantPaymentModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, DollarSign, CreditCard, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentModelSelectorProps {
  restaurantId: string;
  hasActiveSubscription: boolean;
}

export const PaymentModelSelector = ({ 
  restaurantId, 
  hasActiveSubscription 
}: PaymentModelSelectorProps) => {
  const navigate = useNavigate();
  const { 
    paymentModel, 
    commissionRate, 
    commissionConfig,
    customRate,
    switchPaymentModel, 
    loading 
  } = useRestaurantPaymentModel(restaurantId);

  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (newModel: 'subscription' | 'commission') => {
    if (newModel === paymentModel) return;

    if (newModel === 'subscription' && !hasActiveSubscription) {
      navigate('/restaurant/subscription');
      return;
    }

    setIsSwitching(true);
    await switchPaymentModel(newModel);
    setIsSwitching(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Modèle de facturation</h3>
        <p className="text-sm text-muted-foreground">
          Choisissez comment vous souhaitez payer Kwenda
        </p>
      </div>

      {customRate && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Taux personnalisé : {commissionRate}%</strong>
            {customRate.reason && ` - ${customRate.reason}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            paymentModel === 'subscription' 
              ? 'ring-2 ring-primary' 
              : 'hover:border-primary/50'
          }`}
          onClick={() => handleSwitch('subscription')}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <CreditCard className="h-8 w-8 text-primary" />
              {paymentModel === 'subscription' && (
                <Badge className="bg-primary">Actif</Badge>
              )}
            </div>
            <CardTitle className="mt-4">Abonnement mensuel</CardTitle>
            <CardDescription>
              Paiement fixe chaque mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">0% de commission</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Coûts prévisibles</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Tous les avantages du plan</span>
              </div>

              {!hasActiveSubscription && paymentModel !== 'subscription' && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/restaurant/subscription');
                  }}
                >
                  Souscrire un abonnement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            paymentModel === 'commission' 
              ? 'ring-2 ring-primary' 
              : 'hover:border-primary/50'
          }`}
          onClick={() => handleSwitch('commission')}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <DollarSign className="h-8 w-8 text-orange-600" />
              {paymentModel === 'commission' && (
                <Badge className="bg-primary">Actif</Badge>
              )}
            </div>
            <CardTitle className="mt-4">Commission par vente</CardTitle>
            <CardDescription>
              Payez uniquement quand vous vendez
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-orange-600">
                  {commissionRate}% par commande
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Aucun abonnement requis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Paiement à la performance</span>
              </div>

              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  <strong>Exemple :</strong> Vente de 10 000 CDF = {Math.round(10000 * (commissionRate / 100))} CDF de commission
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparaison des modèles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Critère</th>
                  <th className="text-center py-2">Abonnement</th>
                  <th className="text-center py-2">Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Coût mensuel fixe</td>
                  <td className="text-center">✅ 50k-200k CDF</td>
                  <td className="text-center">❌ 0 CDF</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Commission sur ventes</td>
                  <td className="text-center">✅ 0%</td>
                  <td className="text-center">⚠️ {commissionRate}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Idéal pour</td>
                  <td className="text-center">Ventes régulières</td>
                  <td className="text-center">Débuts / tests</td>
                </tr>
                <tr>
                  <td className="py-2">Frais de livraison</td>
                  <td className="text-center">✅ Basés sur distance</td>
                  <td className="text-center">✅ Basés sur distance</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
