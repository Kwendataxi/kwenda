import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Tag, Clock, DollarSign, Percent } from 'lucide-react';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useReferralSystem } from '@/hooks/useReferralSystem';

export const PromoCodeSection = () => {
  const [promoInput, setPromoInput] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const { validatePromoCode, isLoading: promoLoading } = usePromoCode();
  const { 
    userReferralCode, 
    referrals, 
    useReferralCode, 
    shareReferralCode, 
    calculateEarnings,
    isLoading: referralLoading 
  } = useReferralSystem();

  const handleValidatePromo = async () => {
    if (!promoInput.trim()) return;
    
    // Exemple avec un montant fictif pour valider
    await validatePromoCode(promoInput, 10000, 'transport');
  };

  const handleUseReferral = async () => {
    if (!referralInput.trim()) return;
    
    await useReferralCode(referralInput);
    setReferralInput('');
  };

  return (
    <div className="space-y-6">
      {/* Section Codes Promo */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Codes Promo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>
            Utilisez vos codes promo pour bénéficier de réductions exclusives
          </CardDescription>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Entrez votre code promo"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button 
              onClick={handleValidatePromo}
              disabled={!promoInput.trim() || promoLoading}
              className="min-w-[100px]"
            >
              {promoLoading ? 'Vérification...' : 'Valider'}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Gift className="h-4 w-4 mr-2 text-primary" />
              Codes disponibles
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-background rounded border">
                <div>
                  <div className="font-medium">WELCOME20</div>
                  <div className="text-sm text-muted-foreground">20% de réduction - Nouveaux utilisateurs</div>
                </div>
                <Badge variant="secondary">
                  <Percent className="h-3 w-3 mr-1" />
                  20%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-background rounded border">
                <div>
                  <div className="font-medium">FREEDELIVERY</div>
                  <div className="text-sm text-muted-foreground">Livraison gratuite dès 10.000 CDF</div>
                </div>
                <Badge variant="secondary">
                  <Gift className="h-3 w-3 mr-1" />
                  Gratuit
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Parrainage */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Programme de Parrainage</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>
            Parrainez vos amis et gagnez des récompenses ensemble
          </CardDescription>

          {/* Mon Code de Parrainage */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
            <h4 className="font-medium mb-2">Mon code de parrainage</h4>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-lg font-bold text-primary bg-background px-3 py-2 rounded border">
                {userReferralCode || 'Génération...'}
              </div>
              <Button onClick={shareReferralCode} size="sm">
                Partager
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Vous gagnez 5.000 CDF pour chaque ami qui s'inscrit avec votre code
            </p>
          </div>

          {/* Utiliser un Code */}
          <div>
            <h4 className="font-medium mb-2">Utiliser un code de parrainage</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Code de votre ami"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button 
                onClick={handleUseReferral}
                disabled={!referralInput.trim() || referralLoading}
                className="min-w-[100px]"
              >
                {referralLoading ? 'Application...' : 'Utiliser'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recevez 3.000 CDF de crédit après votre première commande
            </p>
          </div>

          <Separator />

          {/* Mes Parrainages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Mes parrainages</h4>
              <Badge variant="outline">
                <DollarSign className="h-3 w-3 mr-1" />
                {calculateEarnings()} CDF gagnés
              </Badge>
            </div>
            
            {referrals.length > 0 ? (
              <div className="space-y-2">
                {referrals.slice(0, 5).map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">Parrainage #{referral.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={referral.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {referral.status === 'pending' && 'En attente'}
                        {referral.status === 'completed' && 'Complété'}
                        {referral.status === 'rewarded' && 'Récompensé'}
                      </Badge>
                      {referral.status === 'completed' && (
                        <span className="text-sm font-medium text-green-600">
                          +{referral.referrer_reward_amount} CDF
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {referrals.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Et {referrals.length - 5} autres parrainages...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun parrainage pour le moment</p>
                <p className="text-xs">Partagez votre code pour commencer à gagner !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};