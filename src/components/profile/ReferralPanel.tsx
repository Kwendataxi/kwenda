import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReferrals } from '@/hooks/useReferrals';
import { Gift, Copy, Share2, Users, Coins, Trophy, TrendingUp } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { CongoButton, CongoCard, CongoBadge, CongoGradient } from '@/components/ui/CongoComponents';
import { SocialShareButtons } from '@/components/referral/SocialShareButtons';
import { ReferralProgress } from '@/components/referral/ReferralProgress';
import { QuickShareMenu } from '@/components/referral/QuickShareMenu';
import { motion } from 'framer-motion';

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
      <DialogContent className="w-[98vw] sm:max-w-2xl h-[95vh] sm:max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Gift className="h-5 w-5 text-congo-green" />
            Système de Parrainage
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Partagez votre code de parrainage et gagnez des récompenses pour chaque utilisateur invité.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-congo-red/10 to-congo-yellow/10 p-1 h-12 sm:h-10">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-congo-red data-[state=active]:to-congo-red-glow data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-3 sm:py-2"
            >
              Aperçu
            </TabsTrigger>
            <TabsTrigger 
              value="invite"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-congo-yellow data-[state=active]:to-congo-yellow-glow data-[state=active]:text-grey-900 transition-all duration-300 text-xs sm:text-sm py-3 sm:py-2"
            >
              Inviter
            </TabsTrigger>
            <TabsTrigger 
              value="rewards"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-congo-green data-[state=active]:to-congo-green-glow data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-3 sm:py-2"
            >
              Niveaux
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6 px-1">
            {/* Code de parrainage avec animations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CongoGradient variant="subtle" className="rounded-xl border border-congo-green/20 shadow-congo-glow">
                <Card className="bg-transparent border-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Gift className="h-5 w-5 text-congo-green" />
                      </motion.div>
                      Votre Code de Parrainage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div 
                      className="relative p-6 bg-gradient-to-r from-congo-green/10 via-congo-yellow/10 to-congo-green/10 border-2 border-dashed border-congo-green/40 rounded-xl shadow-glow"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-grid-pattern opacity-20 rounded-xl"></div>
                      
                      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
                        <motion.span 
                          className="text-3xl sm:text-2xl font-bold text-congo-green tracking-wider text-center sm:text-left animate-congo-pulse"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {loading ? '•••••••••' : referralCode}
                        </motion.span>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <CongoButton
                            variant="success"
                            onClick={copyReferralCode}
                            disabled={loading}
                            className="flex-1 sm:flex-none h-12 sm:h-9 hover:scale-105 transition-transform text-sm sm:text-base"
                          >
                            <Copy className="h-5 w-5 sm:h-4 sm:w-4" />
                          </CongoButton>
                          
                          <QuickShareMenu
                            referralCode={referralCode}
                            userType={stats.userType}
                            reward={stats.currentReward}
                          >
                            <CongoButton
                              variant="default"
                              disabled={loading}
                              className="flex-1 sm:flex-none h-12 sm:h-9 bg-gradient-to-r from-congo-red to-congo-red-glow hover:from-congo-red-vibrant hover:to-congo-red-electric hover:scale-105 transition-all duration-300 shadow-glow text-sm sm:text-base"
                            >
                              <Share2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                              Partager
                            </CongoButton>
                          </QuickShareMenu>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </CongoGradient>
            </motion.div>

            {/* Statistiques avec animations staggerées */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <CongoCard variant="info" className="text-center hover:shadow-congo-vibrant transition-all duration-300">
                  <CardContent className="pt-4 sm:pt-6 pb-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                      <Users className="h-10 w-10 sm:h-8 sm:w-8 mx-auto mb-2 text-congo-blue" />
                    </motion.div>
                    <motion.div 
                      className="text-4xl sm:text-3xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
                    >
                      {stats.totalReferred}
                    </motion.div>
                    <p className="text-sm text-white/80">Parrainés</p>
                  </CardContent>
                </CongoCard>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <CongoCard variant="warning" className="text-center hover:shadow-congo-vibrant transition-all duration-300">
                  <CardContent className="pt-4 sm:pt-6 pb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                      <Coins className="h-10 w-10 sm:h-8 sm:w-8 mx-auto mb-2 text-congo-yellow" />
                    </motion.div>
                    <motion.div 
                      className="text-4xl sm:text-3xl font-bold text-grey-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
                    >
                      {formatCurrency(stats.totalEarned)}
                    </motion.div>
                    <p className="text-sm text-grey-800">Gains Totaux</p>
                  </CardContent>
                </CongoCard>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <CongoCard variant="default" className="text-center hover:shadow-congo-vibrant transition-all duration-300">
                  <CardContent className="pt-4 sm:pt-6 pb-4">
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                    >
                      <TrendingUp className="h-10 w-10 sm:h-8 sm:w-8 mx-auto mb-2 text-congo-red" />
                    </motion.div>
                    <motion.div 
                      className="text-4xl sm:text-3xl font-bold text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.6 }}
                    >
                      {stats.pendingRewards}
                    </motion.div>
                    <p className="text-sm text-white/80">En Attente</p>
                  </CardContent>
                </CongoCard>
              </motion.div>
            </motion.div>

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
          </TabsContent>

          <TabsContent value="invite" className="space-y-4 sm:space-y-6 px-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-congo-green/5 to-congo-yellow/5 border border-congo-green/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-congo-green" />
                    Partager votre code
                  </CardTitle>
                  <DialogDescription className="text-base">
                    Invitez vos {stats.userType === 'client' ? 'amis' : 'filleuls'} et gagnez{' '}
                    <span className="font-bold text-congo-green">
                      {formatCurrency(stats.currentReward)}
                    </span>{' '}
                    par inscription réussie
                  </DialogDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Code de parrainage compact */}
                    <motion.div 
                      className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-congo-green/10 to-congo-yellow/10 border-2 border-dashed border-congo-green/40 rounded-lg"
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="text-2xl font-bold text-congo-green tracking-wider animate-congo-pulse">
                        {loading ? '•••••••••' : referralCode}
                      </span>
                      <CongoButton
                        variant="success"
                        size="sm"
                        onClick={copyReferralCode}
                        disabled={loading}
                        className="hover:scale-105 transition-transform"
                      >
                        <Copy className="h-4 w-4" />
                      </CongoButton>
                    </motion.div>

                    {/* Boutons de partage améliorés */}
                    <SocialShareButtons 
                      referralCode={referralCode}
                      userType={stats.userType}
                      reward={stats.currentReward}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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
                    <p className="text-sm text-muted-foreground">
                      {stats.userType === 'client' 
                        ? 'Envoyez votre code unique à vos amis' 
                        : 'Partagez votre code avec de futurs chauffeurs'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-congo-green text-white flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Ils s'inscrivent</p>
                    <p className="text-sm text-muted-foreground">
                      Vos {stats.userType === 'client' ? 'amis' : 'filleuls'} utilisent votre code lors de l'inscription
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-congo-green text-white flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Gagnez des récompenses</p>
                    <p className="text-sm text-muted-foreground">
                      Recevez {formatCurrency(stats.currentReward)} pour chaque parrainage réussi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4 px-1">
            <ReferralProgress
              userType={stats.userType}
              totalReferred={stats.totalReferred}
              currentTier={stats.currentTier}
              currentReward={stats.currentReward}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};