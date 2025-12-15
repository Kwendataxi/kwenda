import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Trophy, TrendingUp, Users, Gift, RefreshCw, Crown, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LotteryStats {
  gratta: {
    total_cards: number;
    unscratched: number;
    revealed: number;
    today_generated: number;
    today_scratched: number;
    total_xp_distributed: number;
  };
  superLottery: {
    total_draws: number;
    active_draws: number;
    total_entries: number;
    total_points_spent: number;
  };
}

export const LotteryAdminDashboard = () => {
  const [stats, setStats] = useState<LotteryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentWins, setRecentWins] = useState<any[]>([]);
  const [superDraws, setSuperDraws] = useState<any[]>([]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Stats via edge function
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: { action: 'admin_stats' }
      });

      if (data?.success) {
        setStats(data.stats);
      }

      // Gains récents Gratta
      const { data: recent } = await supabase
        .from('lottery_wins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentWins(recent || []);

      // Super Lottery draws
      const { data: draws } = await supabase
        .from('super_lottery_draws')
        .select('*')
        .order('draw_date', { ascending: false })
        .limit(5);

      setSuperDraws(draws || []);

    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <p className="text-muted-foreground">Kwenda Gratta & Super Loterie</p>
        </div>
        <Button onClick={loadStats} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </div>

      <Tabs defaultValue="gratta" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gratta" className="gap-2">
            <Ticket className="h-4 w-4" />
            Kwenda Gratta
          </TabsTrigger>
          <TabsTrigger value="super" className="gap-2">
            <Crown className="h-4 w-4" />
            Super Loterie
          </TabsTrigger>
        </TabsList>

        {/* === KWENDA GRATTA TAB === */}
        <TabsContent value="gratta" className="space-y-6">
          {/* Stats principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-sm">Total Cartes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.gratta.total_cards}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.gratta.unscratched} non grattées
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
                  <div className="text-3xl font-bold">{stats.gratta.revealed}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.gratta.total_cards > 0 
                      ? `${((stats.gratta.revealed / stats.gratta.total_cards) * 100).toFixed(1)}% du total`
                      : '0%'
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-sm">Aujourd'hui</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.gratta.today_generated}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.gratta.today_scratched} grattées
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-sm">XP Distribué</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.gratta.total_xp_distributed.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Points XP</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Gains récents */}
          <Card>
            <CardHeader>
              <CardTitle>10 Dernières Cartes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWins.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune carte générée</p>
                ) : (
                  recentWins.map((win) => {
                    const details = win.prize_details as any;
                    return (
                      <div
                        key={win.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={rarityColors[win.rarity as keyof typeof rarityColors] || 'bg-gray-500'}>
                            {win.rarity || 'common'}
                          </Badge>
                          <div>
                            <div className="font-medium">{details?.name || 'Prix'}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(win.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{details?.value || 0} XP</div>
                          <div className="text-xs text-muted-foreground">
                            {win.scratch_revealed_at ? '✅ Révélée' : '⏳ En attente'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SUPER LOTERIE TAB === */}
        <TabsContent value="super" className="space-y-6">
          {/* Stats Super Loterie */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-sm">Tirages</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.superLottery.total_draws}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.superLottery.active_draws} actif(s)
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-sm">Entrées</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.superLottery.total_entries}</div>
                  <p className="text-xs text-muted-foreground mt-1">Participations totales</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-sm">Points Dépensés</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.superLottery.total_points_spent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Kwenda Points</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-sm">Valeur Cagnotte</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {(stats.superLottery.total_points_spent * 10).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">CDF (estimé)</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Liste des tirages */}
          <Card>
            <CardHeader>
              <CardTitle>Tirages Récents</CardTitle>
              <CardDescription>Historique des super-loteries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {superDraws.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun tirage créé</p>
                ) : (
                  superDraws.map((draw) => {
                    const prizePool = draw.prize_pool as any;
                    const statusColors: Record<string, string> = {
                      active: 'bg-green-500',
                      upcoming: 'bg-blue-500',
                      completed: 'bg-gray-500',
                      drawn: 'bg-yellow-500'
                    };
                    
                    return (
                      <div
                        key={draw.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Crown className="h-8 w-8 text-yellow-500" />
                          <div>
                            <div className="font-medium">{draw.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Tirage: {new Date(draw.draw_date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[draw.status] || 'bg-gray-500'}>
                            {draw.status}
                          </Badge>
                          <div className="text-right">
                            <div className="font-bold">
                              {prizePool 
                                ? `${((prizePool.first || 0) + (prizePool.second || 0) + (prizePool.third || 0)).toLocaleString()} CDF`
                                : 'N/A'
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">Cagnotte</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
