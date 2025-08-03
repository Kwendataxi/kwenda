import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Share2, 
  Copy, 
  Gift, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Star,
  Award
} from 'lucide-react';
import { useReferrals } from '@/hooks/useReferrals';

export const DriverReferrals: React.FC = () => {
  const {
    loading,
    referralCode,
    stats,
    rewards,
    shareReferralCode,
    copyReferralCode,
    getTierInfo
  } = useReferrals();

  const tierInfo = getTierInfo();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rewarded': return <Gift className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'En attente',
      completed: 'Complété',
      rewarded: 'Récompensé'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '🥉';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Programme de Parrainage</h2>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="invite">Inviter</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Parrainés</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalReferred}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gagné</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalEarned)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </CardContent>
            </Card>
          </div>

          {/* Current Tier */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Niveau Actuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTierIcon(stats.currentTier)}</span>
                  <div>
                    <p className="font-semibold capitalize">{stats.currentTier}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(tierInfo.reward)} par parrainage
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className={tierInfo.color}>
                  {stats.totalReferred} parrainés
                </Badge>
              </div>

              {stats.currentTier !== 'platinum' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression vers le niveau suivant</span>
                    <span>{stats.totalReferred} / {tierInfo.max === Infinity ? '100+' : tierInfo.max}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((stats.totalReferred / (tierInfo.max === Infinity ? 100 : tierInfo.max)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          <Card>
            <CardHeader>
              <CardTitle>Parrainages Récents</CardTitle>
              <CardDescription>
                {stats.pendingRewards > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Clock className="w-4 h-4" />
                    <span>{stats.pendingRewards} récompense(s) en attente</span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentReferrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun parrainage pour le moment
                </p>
              ) : (
                stats.recentReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(referral.status)}
                      <div>
                        <p className="font-medium">Code: {referral.referral_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getStatusLabel(referral.status)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Votre Code de Parrainage</CardTitle>
              <CardDescription>
                Partagez ce code avec vos amis et gagnez des récompenses à chaque inscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg text-center font-mono text-lg font-semibold">
                  {referralCode}
                </div>
                <Button variant="outline" size="icon" onClick={copyReferralCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <Button onClick={shareReferralCode} className="w-full" size="lg">
                <Share2 className="w-4 h-4 mr-2" />
                Partager Mon Code
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Partagez votre code</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyez votre code de parrainage à vos amis chauffeurs
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Ils s'inscrivent</p>
                    <p className="text-sm text-muted-foreground">
                      Vos amis utilisent votre code lors de l'inscription
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Vous gagnez des récompenses</p>
                    <p className="text-sm text-muted-foreground">
                      Recevez {formatCurrency(tierInfo.reward)} pour chaque parrainage réussi
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Niveaux de Récompenses</CardTitle>
              <CardDescription>
                Plus vous parrainez, plus vous gagnez par invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { tier: 'bronze', min: 1, max: 20, reward: 2000, icon: '🥉' },
                { tier: 'silver', min: 21, max: 50, reward: 3000, icon: '🥈' },
                { tier: 'gold', min: 51, max: 100, reward: 5000, icon: '🥇' },
                { tier: 'platinum', min: 100, max: Infinity, reward: 10000, icon: '💎' }
              ].map((tier) => (
                <div 
                  key={tier.tier} 
                  className={`p-4 border rounded-lg ${
                    stats.currentTier === tier.tier ? 'bg-primary/10 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tier.icon}</span>
                      <div>
                        <p className="font-semibold capitalize">{tier.tier}</p>
                        <p className="text-sm text-muted-foreground">
                          {tier.min} - {tier.max === Infinity ? '100+' : tier.max} parrainages
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(tier.reward)}</p>
                      <p className="text-sm text-muted-foreground">par parrainage</p>
                    </div>
                  </div>
                  {stats.currentTier === tier.tier && (
                    <Badge className="mt-2" variant="secondary">
                      Niveau Actuel
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reward History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des Récompenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rewards.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucune récompense reçue pour le moment
                </p>
              ) : (
                rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Gift className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Récompense de parrainage</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reward.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(reward.reward_amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {reward.tier_level}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};