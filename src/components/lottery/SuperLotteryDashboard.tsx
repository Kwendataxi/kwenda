import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useKwendaPoints } from '@/hooks/useKwendaPoints';
import { Crown, Trophy, Users, Calendar, Sparkles, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SuperLotteryDraw {
  id: string;
  name: string;
  draw_date: string;
  entry_cost_points: number;
  max_entries: number;
  current_entries: number;
  prize_pool: number;
  status: 'upcoming' | 'active' | 'drawing' | 'completed';
  prizes: {
    first: number;
    second: number;
    third: number;
  };
}

export const SuperLotteryDashboard = () => {
  const { user } = useAuth();
  const { points, enterSuperLottery } = useKwendaPoints();
  const [currentDraw, setCurrentDraw] = useState<SuperLotteryDraw | null>(null);
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentDraw();
    loadMyEntries();
  }, [user]);

  const loadCurrentDraw = async () => {
    try {
      // Simuler une super-loterie mensuelle
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const daysUntilDraw = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const { data: entries } = await supabase
        .from('super_lottery_entries')
        .select('*')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

      const entriesCount = entries?.length || 0;
      const prizePool = entriesCount * 100 * 1000; // 100 points = 1000 CDF

      setCurrentDraw({
        id: `monthly-${now.getFullYear()}-${now.getMonth() + 1}`,
        name: `Super Loterie ${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        draw_date: nextMonth.toISOString(),
        entry_cost_points: 100,
        max_entries: 1000,
        current_entries: entriesCount,
        prize_pool: prizePool,
        status: 'active',
        prizes: {
          first: Math.floor(prizePool * 0.5),
          second: Math.floor(prizePool * 0.3),
          third: Math.floor(prizePool * 0.2)
        }
      });
    } catch (error) {
      console.error('Erreur chargement super-loterie:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyEntries = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('super_lottery_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setMyEntries(data || []);
    } catch (error) {
      console.error('Erreur chargement entrées:', error);
    }
  };

  const handleEnter = async () => {
    if (!currentDraw) return;

    const success = await enterSuperLottery(currentDraw.id, currentDraw.entry_cost_points);
    if (success) {
      await loadCurrentDraw();
      await loadMyEntries();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentDraw) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-base font-medium">Aucune super-loterie en cours</p>
        </CardContent>
      </Card>
    );
  }

  const daysUntilDraw = Math.ceil(
    (new Date(currentDraw.draw_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const progressPercent = (currentDraw.current_entries / currentDraw.max_entries) * 100;
  const canAfford = points.total_points >= currentDraw.entry_cost_points;

  return (
    <div className="space-y-4">
      {/* Header avec gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 p-6 border-2 border-yellow-500/30"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="h-12 w-12 text-yellow-500" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">{currentDraw.name}</h3>
            <p className="text-sm text-muted-foreground">
              Tirage dans {daysUntilDraw} jour{daysUntilDraw > 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {currentDraw.current_entries} / {currentDraw.max_entries}
          </Badge>
        </div>
      </motion.div>

      {/* Prize Pool */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cagnotte Totale</CardTitle>
              <CardDescription>Répartie entre 3 gagnants</CardDescription>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl font-extrabold text-primary mb-2"
            >
              {currentDraw.prize_pool.toLocaleString()}
            </motion.div>
            <p className="text-sm text-muted-foreground">CDF à gagner</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">1er Prix</span>
              </div>
              <span className="text-xl font-bold">{currentDraw.prizes.first.toLocaleString()} CDF</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-400/10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gray-400" />
                <span className="font-medium">2ème Prix</span>
              </div>
              <span className="text-lg font-bold">{currentDraw.prizes.second.toLocaleString()} CDF</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-600/10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-600" />
                <span className="font-medium">3ème Prix</span>
              </div>
              <span className="text-lg font-bold">{currentDraw.prizes.third.toLocaleString()} CDF</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participation */}
      <Card>
        <CardHeader>
          <CardTitle>Participer</CardTitle>
          <CardDescription>Coût : {currentDraw.entry_cost_points} Kwenda Points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Vos points</p>
              <p className="text-2xl font-bold">{points.total_points}</p>
            </div>
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleEnter}
            disabled={!canAfford}
          >
            {canAfford ? (
              <>
                <Trophy className="mr-2 h-5 w-5" />
                Participer ({currentDraw.entry_cost_points} points)
              </>
            ) : (
              `Pas assez de points (${currentDraw.entry_cost_points} requis)`
            )}
          </Button>

          {myEntries.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✅ Vous avez {myEntries.length} entrée{myEntries.length > 1 ? 's' : ''} pour ce tirage
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Participation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {currentDraw.current_entries} participants sur {currentDraw.max_entries} max
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
