import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScratchCard } from './ScratchCard';
import { ScratchCardWin } from '@/types/scratch-card';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Trophy, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsCard } from '../StatsCard';

export const ScratchCardGallery: React.FC = () => {
  const [wins, setWins] = useState<ScratchCardWin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWins();

    // Subscribe to new scratch cards
    const channel = supabase
      .channel('scratch-cards')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lottery_wins',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        () => {
          loadWins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadWins = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lottery_wins')
        .select(`
          id,
          prize_details,
          created_at,
          status,
          scratch_revealed_at,
          scratch_percentage,
          rarity,
          reward_type,
          points_awarded
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedWins: ScratchCardWin[] = (data || []).map(win => {
        const details = win.prize_details as any;
        return {
          win_id: win.id,
          id: details?.prize_id || win.id,
          name: details?.name || 'Prix',
          value: details?.value || 0,
          currency: details?.currency || 'CDF',
          rarity: (win.rarity || 'common') as any,
          reward_type: (win.reward_type || 'cash') as any,
          image_url: details?.image_url,
          scratch_percentage: win.scratch_percentage || 0,
          scratch_revealed_at: win.scratch_revealed_at,
          created_at: win.created_at
        };
      });

      setWins(formattedWins);
    } catch (error) {
      console.error('Error loading scratch cards:', error);
      toast.error('Erreur lors du chargement des cartes');
    } finally {
      setLoading(false);
    }
  };

  const unscratched = wins.filter(w => !w.scratch_revealed_at && w.scratch_percentage < 70);
  const revealed = wins.filter(w => w.scratch_revealed_at || w.scratch_percentage >= 70);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats améliorées avec animations */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard
          icon={<Ticket className="h-6 w-6" />}
          value={unscratched.length}
          label="À gratter"
          color="from-blue-500 to-cyan-500"
          trend={unscratched.length > 0 ? 'Nouveau!' : undefined}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </StatsCard>
        
        <StatsCard
          icon={<Trophy className="h-6 w-6" />}
          value={revealed.length}
          label="Révélées"
          color="from-yellow-500 to-orange-500"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </StatsCard>
        
        <StatsCard
          icon={<Gift className="h-6 w-6" />}
          value={wins.length}
          label="Total"
          color="from-green-500 to-emerald-500"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </StatsCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scratch" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scratch">
            À gratter ({unscratched.length})
          </TabsTrigger>
          <TabsTrigger value="revealed">
            Révélées ({revealed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scratch" className="space-y-4 mt-6">
          {unscratched.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {unscratched.map((win, index) => (
                  <motion.div
                    key={win.win_id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 } 
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.03, zIndex: 10 }}
                  >
                    <ScratchCard
                      win={win}
                      onReveal={loadWins}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Aucune carte à gratter pour le moment
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Gagnez des tickets en utilisant l'app !
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="revealed" className="space-y-4 mt-6">
          {revealed.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {revealed.map((win, index) => (
                  <motion.div
                    key={win.win_id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: { delay: index * 0.1 }
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <ScratchCard
                      win={win}
                      onReveal={loadWins}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Aucune carte révélée
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
