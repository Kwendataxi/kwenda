import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, TrendingUp, Gift, Share2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReferralStats {
  totalReferrals: number;
  activeDrivers: number;
  totalEarnings: number;
  pendingRewards: number;
}

export const PartnerReferralCodes = () => {
  const { user } = useAuth();
  const [partnerCode, setPartnerCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeDrivers: 0,
    totalEarnings: 0,
    pendingRewards: 0
  });
  const [referredDrivers, setReferredDrivers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadPartnerCode();
      loadReferralStats();
    }
  }, [user?.id]);

  const loadPartnerCode = async () => {
    const { data } = await supabase
      .from('partenaires')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (data?.id) {
      // Générer un code à partir de l'ID partenaire (6 premiers caractères en majuscules)
      const code = data.id.substring(0, 8).toUpperCase();
      setPartnerCode(code);
    }
  };

  const loadReferralStats = async () => {
    // Charger les chauffeurs parrainés
    const { data: drivers } = await supabase
      .from('partner_drivers')
      .select(`
        *,
        chauffeur:chauffeurs(display_name, is_active, rating_average)
      `)
      .eq('partner_id', user?.id);

    if (drivers) {
      setReferredDrivers(drivers);
      setStats({
        totalReferrals: drivers.length,
        activeDrivers: drivers.filter(d => d.status === 'active').length,
        totalEarnings: 0, // À calculer depuis les commissions
        pendingRewards: 0
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partnerCode);
    setCopied(true);
    toast.success('Code copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `Rejoins Kwenda en tant que chauffeur ! Utilise mon code partenaire: ${partnerCode} pour bénéficier d'avantages exclusifs.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kwenda - Code Partenaire',
          text: shareText,
        });
      } catch (err) {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const statCards = [
    { icon: Users, label: 'Chauffeurs parrainés', value: stats.totalReferrals, color: 'text-blue-500' },
    { icon: CheckCircle, label: 'Chauffeurs actifs', value: stats.activeDrivers, color: 'text-green-500' },
    { icon: TrendingUp, label: 'Gains totaux', value: `${stats.totalEarnings.toLocaleString()} CDF`, color: 'text-primary' },
    { icon: Gift, label: 'Récompenses en attente', value: stats.pendingRewards, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Code Partenaire Principal */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Votre Code Partenaire</h3>
            
            <motion.div
              className="relative inline-block"
              whileHover={{ scale: 1.02 }}
            >
              <div className="px-8 py-4 bg-background rounded-xl border-2 border-dashed border-primary/50 font-mono text-2xl font-bold tracking-widest text-primary">
                {partnerCode || 'XXXXXX'}
              </div>
            </motion.div>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleCopyCode}
                className="gap-2"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copié !' : 'Copier'}
              </Button>
              <Button onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Partagez ce code avec les chauffeurs pour les ajouter à votre flotte
            </p>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Liste des Chauffeurs Parrainés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chauffeurs Parrainés</CardTitle>
        </CardHeader>
        <CardContent>
          {referredDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun chauffeur parrainé pour le moment</p>
              <p className="text-sm">Partagez votre code pour commencer !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{driver.driver_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {new Date(driver.added_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                    {driver.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
