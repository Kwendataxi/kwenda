import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Trophy, TrendingUp, Users, Gift, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LotteryStats {
  total_cards: number;
  unscratched_cards: number;
  revealed_cards: number;
  total_users_with_cards: number;
  total_value_distributed: number;
  by_rarity: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  today_generated: number;
  today_scratched: number;
}

export const LotteryAdminDashboard = () => {
  const [stats, setStats] = useState<LotteryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentWins, setRecentWins] = useState<any[]>([]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Statistiques globales
      const { data: allWins } = await supabase
        .from('lottery_wins')
        .select('*');

      if (!allWins) return;

      const today = new Date().toISOString().split('T')[0];
      
      const stats: LotteryStats = {
        total_cards: allWins.length,
        unscratched_cards: allWins.filter(w => !w.scratch_revealed_at).length,
        revealed_cards: allWins.filter(w => w.scratch_revealed_at).length,
        total_users_with_cards: new Set(allWins.map(w => w.user_id)).size,
        total_value_distributed: allWins
          .filter(w => w.scratch_revealed_at)
          .reduce((sum, w) => sum + ((w.prize_details as any)?.value || 0), 0),
        by_rarity: {
          common: allWins.filter(w => w.rarity === 'common').length,
          rare: allWins.filter(w => w.rarity === 'rare').length,
          epic: allWins.filter(w => w.rarity === 'epic').length,
          legendary: allWins.filter(w => w.rarity === 'legendary').length,
        },
        today_generated: allWins.filter(w => w.created_at?.startsWith(today)).length,
        today_scratched: allWins.filter(w => w.scratch_revealed_at?.startsWith(today)).length
      };

      setStats(stats);

      // Gains récents
      const { data: recent } = await supabase
        .from('lottery_wins')
        .select(`
          *,
          user:user_id (
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentWins(recent || []);

    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Refresh toutes les 30 secondes
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500'
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">🎰 Gestion Tombola</h2>
          <p className="text-muted-foreground">Statistiques et supervision du système de loterie</p>
        </div>
        <Button onClick={loadStats} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm">Cartes Total</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_cards}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.unscratched_cards} non grattées
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-sm">Révélées</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.revealed_cards}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.revealed_cards / stats.total_cards) * 100).toFixed(1)}% du total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <CardTitle className="text-sm">Utilisateurs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_users_with_cards}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avec au moins 1 carte
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-sm">Valeur Totale</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.total_value_distributed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">CDF distribués</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="rarity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rarity">Par Rareté</TabsTrigger>
          <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
          <TabsTrigger value="recent">Récents</TabsTrigger>
        </TabsList>

        <TabsContent value="rarity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution par Rareté</CardTitle>
              <CardDescription>Répartition des cartes générées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.by_rarity).map(([rarity, count]) => (
                <div key={rarity} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={rarityColors[rarity as keyof typeof rarityColors]}>
                      {rarity}
                    </Badge>
                    <span className="text-sm text-muted-foreground capitalize">{rarity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{count}</div>
                    <span className="text-xs text-muted-foreground">
                      ({((count / stats.total_cards) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Générées Aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-500">{stats.today_generated}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grattées Aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500">{stats.today_scratched}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>10 Derniers Gains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWins.map((win) => {
                  const details = win.prize_details as any;
                  return (
                    <div
                      key={win.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={rarityColors[win.rarity as keyof typeof rarityColors]}>
                          {win.rarity}
                        </Badge>
                        <div>
                          <div className="font-medium">{details?.name || 'Prix'}</div>
                          <div className="text-xs text-muted-foreground">
                            {win.user?.display_name || win.user?.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{details?.value?.toLocaleString()} CDF</div>
                        <div className="text-xs text-muted-foreground">
                          {win.scratch_revealed_at ? '✅ Révélée' : '⏳ En attente'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
