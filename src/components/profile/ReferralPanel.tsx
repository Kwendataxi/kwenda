import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReferrals } from '@/hooks/useReferrals';
import { Gift, Copy, Share2, Users, Coins, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-congo-primary" />
            Système de Parrainage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code de parrainage */}
          <Card className="congo-gradient-subtle">
            <CardHeader>
              <CardTitle className="text-lg">Votre Code de Parrainage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border-2 border-dashed border-congo-primary/30">
                <span className="text-2xl font-bold text-congo-primary tracking-wider">
                  {loading ? '...' : referralCode}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyReferralCode}
                    disabled={loading}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={shareReferralCode}
                    disabled={loading}
                    className="congo-gradient text-white"
                  >
                    <Share2 className="h-4 w-4" />
                    Partager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 mx-auto mb-2 text-congo-primary" />
                <div className="text-2xl font-bold">{stats.totalReferred}</div>
                <p className="text-sm text-muted-foreground">Parrainés</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Coins className="h-8 w-8 mx-auto mb-2 text-congo-accent" />
                <div className="text-2xl font-bold">{stats.totalEarned} CDF</div>
                <p className="text-sm text-muted-foreground">Gains Totaux</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-congo-secondary" />
                <div className="text-2xl font-bold">{stats.pendingRewards}</div>
                <p className="text-sm text-muted-foreground">En Attente</p>
              </CardContent>
            </Card>
          </div>

          {/* Niveau actuel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Niveau Actuel
                </CardTitle>
                <Badge 
                  variant="secondary" 
                  className={cn("text-white", tierInfo.color)}
                  style={{ backgroundColor: tierInfo.color.replace('text-', '') }}
                >
                  {stats.currentTier.toUpperCase()}
                </Badge>
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
              <div className="p-3 bg-muted rounded-lg">
                <span className="font-medium">Récompense actuelle: </span>
                <span className="text-congo-primary font-bold">{tierInfo.reward} CDF</span>
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
                <div className="w-6 h-6 rounded-full bg-congo-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Partagez votre code</p>
                  <p className="text-sm text-muted-foreground">Envoyez votre code unique à vos amis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-congo-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Ils s'inscrivent</p>
                  <p className="text-sm text-muted-foreground">Vos amis utilisent votre code lors de l'inscription</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-congo-primary text-white flex items-center justify-center text-sm font-bold">3</div>
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