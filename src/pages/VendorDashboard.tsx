import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Wallet, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { VendorOrdersList } from '@/components/vendor/VendorOrdersList';
import { VendorProductManager } from '@/components/vendor/VendorProductManager';
import { VendorEarnings } from '@/components/vendor/VendorEarnings';

interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    activeProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });

  useEffect(() => {
    if (user) {
      loadVendorStats();
    }
  }, [user]);

  const loadVendorStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Stats produits
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('id, moderation_status')
        .eq('seller_id', user.id);

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => 
        p.moderation_status === 'approved' || p.moderation_status === 'active'
      ).length || 0;
      const pendingProducts = products?.filter(p => 
        p.moderation_status === 'pending'
      ).length || 0;

      // Stats commandes
      const { data: orders } = await supabase
        .from('marketplace_orders')
        .select('id, status, total_amount')
        .eq('seller_id', user.id);

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => 
        o.status === 'pending' || o.status === 'awaiting_vendor_confirmation'
      ).length || 0;
      const completedOrders = orders?.filter(o => 
        o.status === 'completed' || o.status === 'delivered'
      ).length || 0;

      // Stats revenus
      const { data: earnings } = await supabase
        .from('vendor_wallet_transactions')
        .select('amount, transaction_type, status')
        .eq('vendor_id', user.id);

      const totalEarnings = earnings
        ?.filter(e => e.transaction_type === 'sale' && e.status === 'completed')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const pendingEarnings = earnings
        ?.filter(e => e.transaction_type === 'sale' && e.status === 'pending')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        totalProducts,
        activeProducts,
        pendingProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalEarnings,
        pendingEarnings
      });
    } catch (error) {
      console.error('Error loading vendor stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/marketplace')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Espace Vendeur</h1>
                <p className="text-sm text-muted-foreground">Gérez vos produits et commandes</p>
              </div>
            </div>
            <Button onClick={() => navigate('/marketplace/sell')}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingProducts} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEarnings.toLocaleString()} FC</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedOrders} commandes complétées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingEarnings.toLocaleString()} FC</div>
              <p className="text-xs text-muted-foreground">
                À recevoir
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {stats.pendingOrders > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">
                    {stats.pendingOrders} nouvelle{stats.pendingOrders > 1 ? 's' : ''} commande{stats.pendingOrders > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-orange-700">
                    Action requise : validez les frais de livraison
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="relative">
              Commandes
              {stats.pendingOrders > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.pendingOrders}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="earnings">Revenus</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <VendorOrdersList onRefresh={loadVendorStats} />
          </TabsContent>

          <TabsContent value="products">
            <VendorProductManager onUpdate={loadVendorStats} />
          </TabsContent>

          <TabsContent value="earnings">
            <VendorEarnings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
