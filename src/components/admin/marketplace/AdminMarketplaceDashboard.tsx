import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  Users, 
  Shield, 
  TrendingUp,
  Eye,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  images: any;
  category: string;
  moderation_status: string;
  seller_id: string;
  created_at: string;
}

interface Vendor {
  user_id: string;
  shop_name: string;
  average_rating: number;
  total_sales: number;
  created_at: string;
}

export const AdminMarketplaceDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingProducts: 0,
    activeVendors: 0,
    totalEscrow: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger produits en attente
      const { data: products, error: productsError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setPendingProducts(products || []);

      // Charger vendeurs
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendor_profiles')
        .select('user_id, shop_name, average_rating, total_sales, created_at')
        .order('created_at', { ascending: false });

      if (vendorsError) throw vendorsError;
      setVendors(vendorsData || []);

      // Calculer statistiques
      const { count: totalProducts } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true });

      const { count: activeVendorsCount } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true });

      // Total escrow (ordres non complétés)
      const { data: escrowOrders } = await supabase
        .from('marketplace_orders')
        .select('total_amount')
        .in('status', ['pending', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered']);

      const totalEscrow = escrowOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      setStats({
        totalProducts: totalProducts || 0,
        pendingProducts: products?.length || 0,
        activeVendors: activeVendorsCount || 0,
        totalEscrow,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ moderation_status: 'approved' })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: '✅ Produit approuvé',
        description: 'Le produit est maintenant visible sur la marketplace',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ 
          moderation_status: 'rejected',
          rejection_reason: 'Non conforme aux règles de la marketplace'
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: '❌ Produit rejeté',
        description: 'Le vendeur a été notifié',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleVendor = async (vendorId: string) => {
    try {
      toast({
        title: '⚠️ Fonctionnalité en développement',
        description: 'Activation/désactivation des vendeurs bientôt disponible',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalProducts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Modération
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{stats.pendingProducts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendeurs Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.activeVendors}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Escrow Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">
                {(stats.totalEscrow / 1000).toFixed(0)}K
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="moderation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="moderation">
            <Package className="h-4 w-4 mr-2" />
            Modération Produits
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Users className="h-4 w-4 mr-2" />
            Gestion Vendeurs
          </TabsTrigger>
          <TabsTrigger value="escrow">
            <Shield className="h-4 w-4 mr-2" />
            Escrow Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits en attente de modération ({pendingProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun produit en attente
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <img 
                        src={Array.isArray(product.images) ? product.images[0] : '/placeholder.svg'} 
                        alt={product.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.price.toLocaleString()} CDF • {product.category}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/marketplace?product=${product.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveProduct(product.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectProduct(product.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des vendeurs ({vendors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div key={vendor.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{vendor.shop_name}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          ⭐ {vendor.average_rating.toFixed(1)}
                        </Badge>
                        <Badge variant="secondary">
                          {vendor.total_sales} ventes
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVendor(vendor.user_id)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Gérer
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrow">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">
                  {stats.totalEscrow.toLocaleString()} CDF
                </p>
                <p className="text-sm text-muted-foreground">
                  Fonds actuellement en protection
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Tableau de bord analytics en développement
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
