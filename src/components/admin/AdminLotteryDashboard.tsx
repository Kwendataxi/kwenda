import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, 
  Trophy, 
  Timer, 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp,
  Play,
  Pause,
  Settings,
  Gift,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PartnerPrizesManager } from './lottery/PartnerPrizesManager';
import { PartnerPrizeClaimsTracker } from './lottery/PartnerPrizeClaimsTracker';

interface LotteryDraw {
  id: string;
  name: string;
  draw_type: string;
  scheduled_date: string;
  status: string;
  min_tickets_required: number;
  max_winners: number;
  total_participants: number;
  prize_pool: any;
  total_tickets_used: number;
}

interface LotteryStats {
  totalTicketsIssued: number;
  totalParticipants: number;
  totalPrizesAwarded: number;
  activeDraws: number;
}

export const AdminLotteryDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LotteryStats>({
    totalTicketsIssued: 0,
    totalParticipants: 0,
    totalPrizesAwarded: 0,
    activeDraws: 0
  });
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [isCreatingDraw, setIsCreatingDraw] = useState(false);

  // Form states pour création de tirage
  const [newDrawForm, setNewDrawForm] = useState({
    name: '',
    draw_type: 'daily',
    scheduled_date: '',
    min_tickets_required: 1,
    max_winners: 1,
    prize_pool: [
      { type: 'credits', value: 5000, quantity: 1, name: 'Prix Principal' }
    ]
  });

  // Charger les statistiques
  const loadStats = async () => {
    try {
      // Total tickets émis
      const { count: ticketsCount } = await supabase
        .from('lottery_tickets')
        .select('*', { count: 'exact', head: true });

      // Participants uniques
      const { data: participants } = await supabase
        .from('lottery_entries')
        .select('user_id');

      // Prix attribués
      const { count: prizesCount } = await supabase
        .from('lottery_wins')
        .select('*', { count: 'exact', head: true });

      // Tirages actifs
      const { count: activeDrawsCount } = await supabase
        .from('lottery_draws')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'active']);

      setStats({
        totalTicketsIssued: ticketsCount || 0,
        totalParticipants: new Set(participants?.map(p => p.user_id) || []).size,
        totalPrizesAwarded: prizesCount || 0,
        activeDraws: activeDrawsCount || 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Charger les tirages
  const loadDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('*')
        .order('scheduled_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDraws(data || []);
    } catch (error) {
      console.error('Erreur chargement tirages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tirages",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadStats();
    loadDraws();
  }, []);

  // Créer un nouveau tirage
  const handleCreateDraw = async () => {
    if (!newDrawForm.name || !newDrawForm.scheduled_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lottery_draws')
        .insert({
          name: newDrawForm.name,
          draw_type: newDrawForm.draw_type,
          scheduled_date: newDrawForm.scheduled_date,
          min_tickets_required: newDrawForm.min_tickets_required,
          max_winners: newDrawForm.max_winners,
          prize_pool: newDrawForm.prize_pool,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Tirage créé",
        description: `Le tirage "${newDrawForm.name}" a été programmé`,
      });

      setIsCreatingDraw(false);
      setNewDrawForm({
        name: '',
        draw_type: 'daily',
        scheduled_date: '',
        min_tickets_required: 1,
        max_winners: 1,
        prize_pool: [
          { type: 'credits', value: 5000, quantity: 1, name: 'Prix Principal' }
        ]
      });
      loadDraws();
      loadStats();
    } catch (error) {
      console.error('Erreur création tirage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le tirage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Déclencher un tirage manuellement
  const handleTriggerDraw = async (drawId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('lottery-system', {
        body: { action: 'drawLottery', drawId }
      });

      if (error) throw error;

      toast({
        title: "Tirage lancé",
        description: "Le tirage a été exécuté avec succès",
      });

      loadDraws();
      loadStats();
    } catch (error) {
      console.error('Erreur déclenchement tirage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déclencher le tirage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programmé';
      case 'active': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Gestion Tombola
          </h1>
          <p className="text-muted-foreground">
            Administration du système de tombola et tirages
          </p>
        </div>
        <Button
          onClick={() => setIsCreatingDraw(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau Tirage
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Émis</p>
                <p className="text-2xl font-bold">{stats.totalTicketsIssued.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Participants</p>
                <p className="text-2xl font-bold">{stats.totalParticipants.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-accent/10 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-lg">
                <Gift className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prix Distribués</p>
                <p className="text-2xl font-bold">{stats.totalPrizesAwarded.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Timer className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tirages Actifs</p>
                <p className="text-2xl font-bold">{stats.activeDraws}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="draws">Tirages</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="partner-prizes" className="flex items-center gap-1">
            <Gift className="h-3.5 w-3.5" />
            Cadeaux
          </TabsTrigger>
          <TabsTrigger value="claims" className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            Réclamations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tirages récents */}
            <Card>
              <CardHeader>
                <CardTitle>Tirages Récents</CardTitle>
                <CardDescription>Derniers tirages programmés ou exécutés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {draws.slice(0, 5).map((draw) => (
                    <div key={draw.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{draw.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(draw.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(draw.status)}>
                        {getStatusLabel(draw.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
                <CardDescription>Gestion et monitoring du système</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsCreatingDraw(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un nouveau tirage
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      await supabase.functions.invoke('schedule-lottery-draws');
                      toast({
                        title: "Succès",
                        description: "Tirages automatiques programmés",
                      });
                    } catch (error) {
                      toast({
                        title: "Erreur",
                        description: "Erreur lors de la programmation",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Programmer tirages automatiques
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    loadStats();
                    loadDraws();
                    toast({
                      title: "Actualisé",
                      description: "Données mises à jour",
                    });
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Actualiser les statistiques
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="draws" className="space-y-6">
          {/* Liste des tirages */}
          <Card>
            <CardHeader>
              <CardTitle>Tous les Tirages</CardTitle>
              <CardDescription>Gestion complète des tirages de tombola</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {draws.map((draw) => (
                  <div key={draw.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{draw.name}</h4>
                        <Badge variant="outline">{draw.draw_type}</Badge>
                        <Badge className={getStatusColor(draw.status)}>
                          {getStatusLabel(draw.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Programmé: {format(new Date(draw.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Participants: {draw.total_participants}</span>
                        <span>Tickets utilisés: {draw.total_tickets_used}</span>
                        <span>Max gagnants: {draw.max_winners}</span>
                      </div>
                    </div>
                    
                    {draw.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleTriggerDraw(draw.id)}
                        disabled={loading}
                        className="ml-4"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Exécuter
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Participants</CardTitle>
              <CardDescription>Suivi des participants et leurs tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fonctionnalité de gestion des participants en développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Cadeaux Partenaires */}
        <TabsContent value="partner-prizes" className="space-y-6">
          <PartnerPrizesManager />
        </TabsContent>

        {/* Onglet Réclamations */}
        <TabsContent value="claims" className="space-y-6">
          <PartnerPrizeClaimsTracker />
        </TabsContent>
      </Tabs>

      {/* Modal de création de tirage */}
      {isCreatingDraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreatingDraw(false)} />
          <Card className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Nouveau Tirage</CardTitle>
              <CardDescription>Créer un nouveau tirage de tombola</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du tirage</Label>
                <Input
                  id="name"
                  value={newDrawForm.name}
                  onChange={(e) => setNewDrawForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Tirage Flash du Vendredi"
                />
              </div>

              <div>
                <Label htmlFor="draw_type">Type de tirage</Label>
                <Select value={newDrawForm.draw_type} onValueChange={(value) => setNewDrawForm(prev => ({ ...prev, draw_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="special">Spécial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scheduled_date">Date et heure</Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={newDrawForm.scheduled_date}
                  onChange={(e) => setNewDrawForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_tickets">Tickets min</Label>
                  <Input
                    id="min_tickets"
                    type="number"
                    min="1"
                    value={newDrawForm.min_tickets_required}
                    onChange={(e) => setNewDrawForm(prev => ({ ...prev, min_tickets_required: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="max_winners">Max gagnants</Label>
                  <Input
                    id="max_winners"
                    type="number"
                    min="1"
                    value={newDrawForm.max_winners}
                    onChange={(e) => setNewDrawForm(prev => ({ ...prev, max_winners: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingDraw(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateDraw}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};