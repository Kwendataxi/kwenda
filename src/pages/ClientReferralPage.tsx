import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReferralSystem } from '@/hooks/useReferralSystem';
import { Users, Copy, Share2, Gift, Trophy, Star, TrendingUp, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type confetti from 'canvas-confetti';
declare const confetti: typeof import('canvas-confetti').default;

const ClientReferralPage = () => {
  const navigate = useNavigate();
  const { userReferralCode, referrals, calculateEarnings, shareReferralCode } = useReferralSystem();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userReferralCode);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    toast.success('Code copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarnings = calculateEarnings();
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client')}
            className="text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Parrainage</h1>
              <p className="text-white/90">Invitez vos amis et gagnez ensemble</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6 -mt-8">
        {/* Code de parrainage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Votre code de parrainage</span>
                </div>
                
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-2xl">
                  <div className="text-5xl font-black tracking-widest text-primary mb-4">
                    {userReferralCode || 'LOADING...'}
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={handleCopyCode}
                      size="lg"
                      className="gap-2"
                    >
                      <Copy className="h-5 w-5" />
                      {copied ? 'Copié !' : 'Copier le code'}
                    </Button>
                    
                    <Button
                      onClick={shareReferralCode}
                      variant="outline"
                      size="lg"
                      className="gap-2"
                    >
                      <Share2 className="h-5 w-5" />
                      Partager
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Gagnez <span className="font-bold text-primary">2000 CDF</span> par ami qui s'inscrit avec votre code
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <div className="text-3xl font-bold">{completedReferrals}</div>
              <div className="text-sm text-muted-foreground">Amis parrainés</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold">{totalEarnings} CDF</div>
              <div className="text-sm text-muted-foreground">Gains totaux</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold">{referrals.length}</div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </CardContent>
          </Card>
        </div>

        {/* Historique */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des parrainages</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Aucun parrainage pour le moment</p>
                <p className="text-sm mt-2">Partagez votre code pour commencer !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        referral.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">Parrainage #{referral.id.slice(0, 8)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-primary">+{referral.referrer_reward_amount} CDF</div>
                      <div className={`text-xs ${
                        referral.status === 'completed' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {referral.status === 'completed' ? 'Complété' : 'En attente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientReferralPage;
