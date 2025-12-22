/**
 * 🎁 Dashboard de parrainage client moderne
 * - Code QR et partage
 * - Stats des filleuls
 * - Liste des récompenses
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  Wallet, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Sparkles,
  MessageCircle,
  Send,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientReferral } from '@/hooks/useClientReferral';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const ClientReferralDashboard = () => {
  const navigate = useNavigate();
  const {
    referralCode,
    referrals,
    stats,
    loading,
    shareReferralCode,
    copyToClipboard,
    getShareLink,
    REWARD_PER_REFERRAL
  } = useClientReferral();

  const [showQR, setShowQR] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-2xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const shareOptions = [
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () => {
        const text = `Rejoins Kwenda avec mon code ${referralCode?.code} et reçois ${REWARD_PER_REFERRAL} CDF ! ${getShareLink()}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    { 
      id: 'telegram', 
      name: 'Telegram', 
      icon: Send,
      color: 'bg-blue-500',
      action: () => {
        const text = `Rejoins Kwenda avec mon code ${referralCode?.code} et reçois ${REWARD_PER_REFERRAL} CDF !`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareLink())}&text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    { 
      id: 'sms', 
      name: 'SMS', 
      icon: MessageCircle,
      color: 'bg-orange-500',
      action: () => {
        const text = `Rejoins Kwenda avec mon code ${referralCode?.code} ! ${getShareLink()}`;
        window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Parrainage</h1>
          <div className="ml-auto">
            <Badge variant="secondary" className="gap-1">
              <Gift className="h-3 w-3" />
              {REWARD_PER_REFERRAL} CDF/ami
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-white/80 text-sm font-medium">Votre code de parrainage</span>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
              <div className="text-center">
                <span className="text-3xl font-black text-white tracking-widest">
                  {referralCode?.code || '...'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={copyToClipboard}
                variant="secondary"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
              <Button
                onClick={shareReferralCode}
                className="flex-1 bg-white text-primary hover:bg-white/90"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>
        </motion.div>

        {/* QR Code Toggle */}
        <motion.button
          onClick={() => setShowQR(!showQR)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-sm font-medium text-muted-foreground">
            {showQR ? 'Masquer' : 'Afficher'} le QR Code
          </span>
          <ChevronRight className={cn("h-4 w-4 transition-transform", showQR && "rotate-90")} />
        </motion.button>

        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl shadow-lg">
                    <QRCodeSVG
                      value={getShareLink()}
                      size={180}
                      level="H"
                      includeMargin
                      fgColor="#1a1a1a"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Scannez pour rejoindre Kwenda
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Options */}
        <div className="grid grid-cols-3 gap-3">
          {shareOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={option.action}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn("p-3 rounded-xl", option.color)}>
                <option.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{option.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <div className="text-xs text-muted-foreground">Amis invités</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
            <CardContent className="p-4 text-center">
              <Wallet className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-bold">{stats.totalEarnings}</div>
              <div className="text-xs text-muted-foreground">CDF gagnés</div>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Mes filleuls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals && referrals.length > 0 ? (
              <div className="space-y-3">
                {referrals.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                        referral.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"
                      )}>
                        {referral.referee_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{referral.referee_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {referral.status === 'completed' ? (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-bold">+{referral.reward_amount} CDF</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                          En attente
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Invitez vos amis pour gagner {REWARD_PER_REFERRAL} CDF par inscription !
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { step: 1, text: "Partagez votre code avec vos amis" },
              { step: 2, text: "Ils s'inscrivent avec votre code" },
              { step: 3, text: `Vous recevez ${REWARD_PER_REFERRAL} CDF après leur 1ère course` }
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientReferralDashboard;
