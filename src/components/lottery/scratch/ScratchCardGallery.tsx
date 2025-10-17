import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScratchCard } from './ScratchCard';
import { ScratchCardWin } from '@/types/scratch-card';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Trophy, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Ticket className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{unscratched.length}</p>
            <p className="text-sm text-muted-foreground">À gratter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{revealed.length}</p>
            <p className="text-sm text-muted-foreground">Révélées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{wins.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unscratched.map(win => (
                <ScratchCard
                  key={win.win_id}
                  win={win}
                  onReveal={loadWins}
                />
              ))}
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revealed.map(win => (
                <ScratchCard
                  key={win.win_id}
                  win={win}
                  onReveal={loadWins}
                />
              ))}
            </div>
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
