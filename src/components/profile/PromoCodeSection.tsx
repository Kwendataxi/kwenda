import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Gift, Share2, Copy, Users, Trophy, Percent, Star, Calendar, Tag, Clock } from 'lucide-react';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useReferralSystem } from '@/hooks/useReferralSystem';
import { useRewards } from '@/hooks/useRewards';

export const PromoCodeSection = () => {
  const [promoCode, setPromoCode] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [personalizedCodes, setPersonalizedCodes] = useState<any[]>([]);
  
  const { 
    validatePromoCode, 
    availableCodes, 
    userUsage, 
    getPersonalizedCodes,
    isLoading 
  } = usePromoCode();
  
  const { 
    userReferralCode, 
    referrals, 
    useReferralCode, 
    shareReferralCode, 
    calculateEarnings,
    isLoading: referralLoading 
  } = useReferralSystem();

  const {
    rewards,
    userStats,
    claimReward,
    isLoading: rewardsLoading
  } = useRewards();

  useEffect(() => {
    const loadPersonalizedCodes = async () => {
      const codes = await getPersonalizedCodes();
      setPersonalizedCodes(codes);
    };
    loadPersonalizedCodes();
  }, []);

  const handleApplyPromo = async () => {
    if (promoCode.trim()) {
      await validatePromoCode(promoCode.trim(), 5000, 'transport');
      setPromoCode('');
    }
  };

  const handleUseReferral = async () => {
    if (referralInput.trim()) {
      await useReferralCode(referralInput.trim());
      setReferralInput('');
    }
  };

  const formatDiscount = (code: any) => {
    if (code.discount_type === 'percentage') {
      return `${code.discount_value}%`;
    } else if (code.discount_type === 'fixed_amount') {
      return `${code.discount_value} CDF`;
    } else {
      return 'Livraison gratuite';
    }
  };

  const getLevelProgress = () => {
    if (!userStats) return 0;
    const { loyalty_points } = userStats;
    
    if (loyalty_points < 200) return (loyalty_points / 200) * 100;
    if (loyalty_points < 500) return ((loyalty_points - 200) / 300) * 100;
    if (loyalty_points < 1000) return ((loyalty_points - 500) / 500) * 100;
    return 100;
  };

  const getNextLevelPoints = () => {
    if (!userStats) return 200;
    const { loyalty_points } = userStats;
    
    if (loyalty_points < 200) return 200 - loyalty_points;
    if (loyalty_points < 500) return 500 - loyalty_points;
    if (loyalty_points < 1000) return 1000 - loyalty_points;
    return 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="codes">Codes Promo</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="referral">Parrainage</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          {/* Saisie de code promo */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Appliquer un code promo</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Entrez votre code promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button 
                onClick={handleApplyPromo} 
                disabled={isLoading || !promoCode.trim()}
              >
                {isLoading ? 'Validation...' : 'Appliquer'}
              </Button>
            </div>
          </Card>

          {/* Codes disponibles */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Percent className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Codes promo disponibles</h3>
            </div>
            <div className="grid gap-3">
              {availableCodes.map((code) => (
                <div key={code.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="font-mono">
                          {code.code}
                        </Badge>
                        <Badge variant="outline">
                          {formatDiscount(code)}
                        </Badge>
                        {isExpiringSoon(code.valid_until) && (
                          <Badge variant="destructive" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Expire bientôt
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{code.title}</p>
                      <p className="text-sm text-muted-foreground">{code.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum: {code.min_order_amount} CDF • 
                        Expire le: {formatDate(code.valid_until)} •
                        Services: {code.applicable_services.join(', ')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(code.code);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Codes personnalisés */}
          {personalizedCodes.length > 0 && (
            <Card className="p-6 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Offres personnalisées pour vous</h3>
              </div>
              <div className="grid gap-3">
                {personalizedCodes.map((code) => (
                  <div key={code.id} className="border border-primary/20 rounded-lg p-4 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="font-mono bg-primary text-primary-foreground">
                            {code.code}
                          </Badge>
                          <Badge variant="outline">
                            {formatDiscount(code)}
                          </Badge>
                          <Badge variant="secondary">Exclusif</Badge>
                        </div>
                        <p className="font-medium">{code.title}</p>
                        <p className="text-sm text-muted-foreground">{code.description}</p>
                      </div>
                      <Button
                        onClick={() => setPromoCode(code.code)}
                        size="sm"
                      >
                        Utiliser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          {/* Statut utilisateur */}
          {userStats && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">Votre statut de fidélité</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {userStats.current_level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {userStats.loyalty_points} points
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {userStats.total_orders} commandes • {userStats.total_spent} CDF dépensés
                    </p>
                  </div>
                </div>
                {getNextLevelPoints() > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progression vers le niveau suivant</span>
                      <span>{getNextLevelPoints()} points restants</span>
                    </div>
                    <Progress value={getLevelProgress()} className="h-2" />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Récompenses disponibles */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Récompenses disponibles</h3>
            </div>
            <div className="grid gap-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{reward.title}</h4>
                        {reward.points_required && (
                          <Badge variant="outline">
                            {reward.points_required} points
                          </Badge>
                        )}
                        {reward.expires_at && (
                          <Badge variant="destructive" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expire le {formatDate(reward.expires_at)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    </div>
                    <Button
                      onClick={() => claimReward(reward.id)}
                      disabled={reward.is_claimed || rewardsLoading}
                      size="sm"
                    >
                      {reward.is_claimed ? 'Réclamé' : 'Réclamer'}
                    </Button>
                  </div>
                </div>
              ))}
              {rewards.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune récompense disponible pour le moment</p>
                  <p className="text-sm">Passez plus de commandes pour débloquer des récompenses !</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="referral" className="space-y-4">
          {/* Code de parrainage */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Programme de parrainage</h3>
            </div>
            
            {userReferralCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Votre code de parrainage :</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-lg font-mono bg-background p-2 rounded border">
                      {userReferralCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(userReferralCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={shareReferralCode}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">{referrals.length}</p>
                    <p className="text-sm text-muted-foreground">Parrainages</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{calculateEarnings()} CDF</p>
                    <p className="text-sm text-muted-foreground">Gains totaux</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Chargement de votre code de parrainage...</p>
              </div>
            )}
          </Card>

          {/* Utiliser un code de parrainage */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Utiliser un code de parrainage</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Entrez le code de parrainage"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button 
                onClick={handleUseReferral} 
                disabled={referralLoading || !referralInput.trim()}
              >
                {referralLoading ? 'Validation...' : 'Valider'}
              </Button>
            </div>
          </Card>

          {/* Liste des parrainages */}
          {referrals.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Vos parrainages</h3>
              <div className="space-y-2">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Parrainage #{referral.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={referral.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {referral.status === 'completed' ? 'Validé' : 'En attente'}
                      </Badge>
                      {referral.status === 'completed' && (
                        <p className="text-sm text-green-600 font-medium">
                          +{referral.referrer_reward_amount} CDF
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Historique d'utilisation</h3>
            </div>
            <div className="space-y-3">
              {userUsage.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{usage.promo_codes?.title || 'Code inconnu'}</p>
                    <p className="text-sm text-muted-foreground">
                      Code: {usage.promo_codes?.code} • 
                      {new Date(usage.used_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      -{usage.discount_amount} CDF
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {usage.order_type}
                    </p>
                  </div>
                </div>
              ))}
              {userUsage.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun historique d'utilisation</p>
                  <p className="text-sm">Vos codes promo utilisés apparaîtront ici</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};