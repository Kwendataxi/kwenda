import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Share2, Copy, Users, Gift, Star, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralData {
  userCode: string;
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
  recentReferrals: Array<{
    name: string;
    date: string;
    reward: number;
    status: 'pending' | 'completed';
  }>;
}

const ReferralSystem: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'invite' | 'rewards'>('overview');

  // Mock data - in real app this would come from API
  const referralData: ReferralData = {
    userCode: 'KWENDA2024',
    totalReferred: 12,
    totalEarned: 15000,
    pendingRewards: 3000,
    recentReferrals: [
      { name: 'Marie K.', date: '2024-01-15', reward: 2000, status: 'completed' },
      { name: 'Jean P.', date: '2024-01-14', reward: 2000, status: 'pending' },
      { name: 'Grace M.', date: '2024-01-12', reward: 2000, status: 'completed' },
    ]
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralData.userCode);
    toast({
      title: 'Code copié!',
      description: 'Votre code de parrainage a été copié dans le presse-papier',
    });
  };

  const shareReferralLink = () => {
    const shareText = `Rejoins-moi sur Kwenda Taxi avec mon code de parrainage ${referralData.userCode} et gagne 2000 FC! 🚗💰`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Kwenda Taxi - Code de parrainage',
        text: shareText,
        url: `https://kwenda.app/ref/${referralData.userCode}`
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Lien de partage copié!',
        description: 'Le message de parrainage a été copié',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t('referral.title')}</h2>
        <p className="text-muted-foreground">
          Invitez vos amis et gagnez 2000 FC pour chaque nouvel utilisateur
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: DollarSign },
          { id: 'invite', label: 'Inviter', icon: Share2 },
          { id: 'rewards', label: 'Récompenses', icon: Gift }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Amis parrainés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralData.totalReferred}</div>
              <p className="text-xs text-muted-foreground">+3 ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                {t('referral.total_earned')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(referralData.totalEarned)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(referralData.pendingRewards)} en attente
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Parrainages récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referralData.recentReferrals.map((referral, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-sm text-muted-foreground">{referral.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(referral.reward)}</p>
                      <Badge 
                        variant={referral.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {referral.status === 'completed' ? 'Reçu' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === 'invite' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Votre code de parrainage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input 
                  value={referralData.userCode} 
                  readOnly 
                  className="flex-1 text-center font-bold text-lg"
                />
                <Button variant="outline" size="icon" onClick={copyReferralCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={shareReferralLink} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Partager le code
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Partagez votre code</h4>
                    <p className="text-sm text-muted-foreground">
                      Donnez votre code de parrainage à vos amis
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Inscription avec le code</h4>
                    <p className="text-sm text-muted-foreground">
                      Vos amis s'inscrivent avec votre code
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Gagnez des récompenses</h4>
                    <p className="text-sm text-muted-foreground">
                      Recevez 2000 FC pour chaque ami qui fait sa première course
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Programme de fidélité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Niveau actuel</span>
                  <Badge className="bg-gold text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Bronze
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Parrainez 8 amis de plus pour atteindre le niveau Argent
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Récompenses par niveau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { level: 'Bronze', referrals: '1-20', bonus: '2000 FC', active: true },
                  { level: 'Argent', referrals: '21-50', bonus: '3000 FC', active: false },
                  { level: 'Or', referrals: '51-100', bonus: '5000 FC', active: false },
                  { level: 'Platine', referrals: '100+', bonus: '10000 FC', active: false }
                ].map((tier, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${tier.active ? 'bg-accent border-primary' : 'bg-muted'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tier.level}</p>
                        <p className="text-sm text-muted-foreground">{tier.referrals} parrainages</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{tier.bonus}</p>
                        <p className="text-sm text-muted-foreground">par parrainage</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReferralSystem;