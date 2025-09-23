import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReferrals } from '@/hooks/useReferrals';
import { Gift, Copy, Share2, Users, Coins, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CongoButton, CongoCard, CongoBadge, CongoGradient } from '@/components/ui/CongoComponents';

interface ReferralPanelProps {
  open: boolean;
  onClose: () => void;
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({ open, onClose }) => {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto sm:max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Gift className="h-5 w-5 text-congo-green" />
            Système de Parrainage
          </DialogTitle>
          <DialogDescription>
            Partagez votre code de parrainage et gagnez des récompenses pour chaque utilisateur invité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code de parrainage */}
          <CongoGradient variant="subtle" className="rounded-xl border border-congo-green/20">
            <Card className="bg-transparent border-0">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Votre Code de Parrainage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border-2 border-dashed border-congo-green/40 rounded-lg shadow-lg">
                  <span className="text-xl sm:text-2xl font-bold text-congo-green tracking-wider text-center sm:text-left">
                    {loading ? '...' : referralCode}
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <CongoButton
                      variant="success"
                      size="sm"
                      onClick={copyReferralCode}
                      disabled={loading}
                      className="flex-1 sm:flex-none"
                    >
                      <Copy className="h-4 w-4" />
                    </CongoButton>
                    <CongoButton
                      variant="success"
                      size="sm"
                      onClick={shareReferralCode}
                      disabled={loading}
                      className="flex-1 sm:flex-none"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </CongoButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CongoGradient>

          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CongoCard variant="info" className="text-center">
              <CardContent className="pt-6 pb-4">
                <Users className="h-8 w-8 mx-auto mb-2 text-congo-blue" />
                <div className="text-2xl font-bold text-white">{stats.totalReferred}</div>
                <p className="text-sm text-white/80">Parrainés</p>
              </CardContent>
            </CongoCard>
            
            <CongoCard variant="warning" className="text-center">
              <CardContent className="pt-6 pb-4">
                <Coins className="h-8 w-8 mx-auto mb-2 text-congo-yellow" />
                <div className="text-2xl font-bold text-grey-900">{stats.totalEarned} CDF</div>
                <p className="text-sm text-grey-800">Gains Totaux</p>
              </CardContent>
            </CongoCard>
            
            <CongoCard variant="default" className="text-center">
              <CardContent className="pt-6 pb-4">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-congo-red" />
                <div className="text-2xl font-bold text-white">{stats.pendingRewards}</div>
                <p className="text-sm text-white/80">En Attente</p>
              </CardContent>
            </CongoCard>
          </div>

          {/* Niveau actuel */}
          <Card className="bg-gradient-congo-subtle border-congo-green/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Trophy className="h-5 w-5 text-congo-yellow" />
                  Niveau Actuel
                </CardTitle>
                <CongoBadge variant="success">
                  {stats.currentTier.toUpperCase()}
                </CongoBadge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progression vers le niveau suivant</span>
                <span>{stats.totalReferred}/{tierInfo.max} parrainages</span>
              </div>
              <Progress 
                value={(stats.totalReferred / tierInfo.max) * 100} 
                className="h-2"
              />
              <div className="text-sm text-muted-foreground">
                Plus que {tierInfo.max - stats.totalReferred} parrainages pour le niveau suivant
              </div>
              <div className="p-3 bg-congo-green/10 border border-congo-green/20 rounded-lg">
                <span className="font-medium text-foreground">Récompense actuelle: </span>
                <span className="text-congo-green font-bold">{tierInfo.reward} CDF</span>
                <span className="text-muted-foreground"> par parrainage réussi</span>
              </div>
            </CardContent>
          </Card>

          {/* Parrainages récents */}
          <Card>
            <CardHeader>
              <CardTitle>Parrainages Récents</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentReferrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun parrainage pour le moment</p>
                  <p className="text-sm">Partagez votre code pour commencer !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentReferrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Code utilisé</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                        {referral.status === 'completed' ? 'Validé' : 'En attente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comment ça marche */}
          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-congo-green text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Partagez votre code</p>
                  <p className="text-sm text-muted-foreground">Envoyez votre code unique à vos amis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-congo-green text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Ils s'inscrivent</p>
                  <p className="text-sm text-muted-foreground">Vos amis utilisent votre code lors de l'inscription</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-congo-green text-white flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Gagnez des récompenses</p>
                  <p className="text-sm text-muted-foreground">Recevez des crédits pour chaque parrainage réussi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};