import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Package, DollarSign, Star, Clock, Bell, ChefHat, CreditCard } from 'lucide-react';
import { useFoodOrders } from '@/hooks/useFoodOrders';
import { useRestaurantSubscription } from '@/hooks/useRestaurantSubscription';
import { useFoodNotifications } from '@/hooks/useFoodNotifications';

interface RestaurantStats {
  todayOrders: number;
  todayRevenue: number;
  avgRating: number;
  pendingOrders: number;
}

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [stats, setStats] = useState<RestaurantStats>({
    todayOrders: 0,
    todayRevenue: 0,
    avgRating: 0,
    pendingOrders: 0,
  });

  const { activeSubscription, checkExpirationWarning } = useRestaurantSubscription();
  const { subscribeToOrders } = useFoodOrders();
  
  // Hook de notifications sonores
  useFoodNotifications(restaurantId || undefined);

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Récupérer le profil restaurant
      const { data: profile, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Profil manquant',
            description: 'Créez votre profil restaurant',
            variant: 'destructive',
          });
          navigate('/restaurant/setup');
        }
        throw error;
      }

      setRestaurantId(profile.id);

      // Charger les stats du jour
      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase
        .from('food_orders')
        .select('total_amount, status')
        .eq('restaurant_id', profile.id)
        .gte('created_at', today);

      const todayRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const pendingOrders = orders?.filter(o => ['pending', 'confirmed'].includes(o.status)).length || 0;

      setStats({
        todayOrders: orders?.length || 0,
        todayRevenue,
        avgRating: profile.rating_average || 0,
        pendingOrders,
      });

    } catch (error: any) {
      console.error('Error loading restaurant data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Notifications en temps réel pour rafraîchir les données
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = subscribeToOrders(
      restaurantId,
      () => loadRestaurantData(),
      () => loadRestaurantData()
    );

    return unsubscribe;
  }, [restaurantId]);

  const subscriptionWarning = activeSubscription 
    ? checkExpirationWarning(activeSubscription)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Restaurant</h1>
            <p className="text-muted-foreground">Gérez votre restaurant Kwenda Food</p>
          </div>
          <Button onClick={() => navigate('/restaurant/menu')}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un plat
          </Button>
        </div>

        {/* Message bienvenue nouveaux restaurants */}
        {stats.todayOrders === 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-6 w-6 text-primary" />
                Bienvenue sur Kwenda Food !
              </CardTitle>
              <CardDescription>
                Voici les prochaines étapes pour commencer à recevoir des commandes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge>1</Badge>
                <div>
                  <p className="font-medium">Complétez votre profil</p>
                  <p className="text-sm text-muted-foreground">
                    Logo, horaires, zones de livraison
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge>2</Badge>
                <div>
                  <p className="font-medium">Ajoutez votre menu</p>
                  <p className="text-sm text-muted-foreground">
                    Minimum 5 plats avec photos
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate('/restaurant/menu')}
                  >
                    Gérer mon menu →
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge>3</Badge>
                <div>
                  <p className="font-medium">Choisissez votre abonnement</p>
                  <p className="text-sm text-muted-foreground">
                    Plans dès 50 000 CDF/mois
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate('/restaurant/subscription')}
                  >
                    Voir les plans →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerte abonnement */}
        {subscriptionWarning?.isExpiring && (
          <Card className="border-warning bg-warning/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Abonnement expire bientôt
              </CardTitle>
              <CardDescription>
                Il reste {subscriptionWarning.daysRemaining} jours. Renouvelez maintenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/restaurant/subscription')}>
                Renouveler maintenant
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Commandes aujourd'hui</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{stats.todayOrders}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Revenus du jour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold">{stats.todayRevenue.toLocaleString()} FC</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Note moyenne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>En attente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                <span className="text-3xl font-bold">{stats.pendingOrders}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => navigate('/restaurant/orders')}
            >
              <div className="flex flex-col items-center gap-2">
                <Package className="h-6 w-6" />
                <span>Voir les commandes</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => navigate('/restaurant/menu')}
            >
              <div className="flex flex-col items-center gap-2">
                <Plus className="h-6 w-6" />
                <span>Gérer le menu</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => navigate('/restaurant/billing')}
            >
              <div className="flex flex-col items-center gap-2">
                <CreditCard className="h-6 w-6" />
                <span>Facturation</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => navigate('/restaurant/subscription')}
            >
              <div className="flex flex-col items-center gap-2">
                <DollarSign className="h-6 w-6" />
                <span>Mon abonnement</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
