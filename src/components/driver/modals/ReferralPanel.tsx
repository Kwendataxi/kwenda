import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Share2, Copy, Check, Gift } from 'lucide-react';
import { useReferrals } from '@/hooks/useReferrals';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

export const ReferralPanel: React.FC = () => {
  const { referralCode, referrals, totalEarnings, isLoading } = useReferrals();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    const shareData = {
      title: 'Rejoignez Kwenda',
      text: `Utilisez mon code de parrainage ${referralCode} et gagnez 5000 CDF !`,
      url: `https://kwenda.app/register?ref=${referralCode}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Code de parrainage */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <span className="text-sm opacity-90">Mon code de parrainage</span>
          </div>
          
          {referralCode ? (
            <>
              <div className="text-3xl font-bold mb-4 tracking-wider text-center py-4 bg-white/10 rounded-lg">
                {referralCode}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="secondary"
                  className="flex-1 bg-white text-blue-600 hover:bg-white/90"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
                <Button 
                  variant="secondary"
                  className="flex-1 bg-white text-blue-600 hover:bg-white/90"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>

              {/* QR Code */}
              <div className="mt-4 flex justify-center bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={`https://kwenda.app/register?ref=${referralCode}`}
                  size={150}
                  level="H"
                />
              </div>
            </>
          ) : (
            <p className="text-center text-sm opacity-90">Code de parrainage non disponible</p>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">Filleuls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{totalEarnings.toLocaleString()} CDF</p>
            <p className="text-xs text-muted-foreground">Gains totaux</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Liste des filleuls */}
      <div>
        <h3 className="font-semibold mb-4">Mes filleuls ({referrals.length})</h3>
        {referrals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun filleul pour le moment</p>
              <p className="text-xs mt-1">Partagez votre code pour gagner 5000 CDF par filleul !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <Card key={referral.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{referral.referee_name || 'Utilisateur'}</p>
                      <p className="text-xs text-muted-foreground">
                        Inscrit le {format(new Date(referral.created_at), 'PPP', { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{referral.reward_amount} CDF</p>
                      <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                        {referral.status === 'completed' ? 'Récompensé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
