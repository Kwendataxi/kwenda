import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, ShoppingCart, Users, Eye, Edit, Trash2, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SellerModerationPanel } from './marketplace/SellerModerationPanel';
import { SellerVerificationPanel } from './marketplace/SellerVerificationPanel';
import { ProductAnalyticsDashboard } from './marketplace/ProductAnalyticsDashboard';
import { ProductModerationQueue } from './marketplace/ProductModerationQueue';

export function AdminMarketplaceManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch marketplace statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['marketplaceStats'],
    queryFn: async () => {
      const [productsRes, ordersRes, sellersRes] = await Promise.all([
        supabase.from('marketplace_products').select('id, moderation_status', { count: 'exact' }),
        supabase.from('marketplace_orders').select('id, status, total_amount', { count: 'exact' }),
        supabase.from('seller_profiles').select('id', { count: 'exact' })
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];

      return {
        totalProducts: productsRes.count || 0,
        pendingModeration: products.filter(p => p.moderation_status === 'pending').length,
        approvedProducts: products.filter(p => p.moderation_status === 'approved').length,
        rejectedProducts: products.filter(p => p.moderation_status === 'rejected').length,
        totalOrders: ordersRes.count || 0,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSellers: sellersRes.count || 0,
        totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0)
      };
    },
    refetchInterval: 30000
  });

  // Fetch real products data
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['marketplaceProducts', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch seller info separately
      const productsWithSellers = await Promise.all(
        (data || []).map(async (p) => {
          const { data: seller } = await supabase
            .from('seller_profiles')
            .select('display_name, verified_seller')
            .eq('user_id', p.seller_id)
            .single();

          return {
            id: p.id,
            name: p.title,
            price: p.price,
            moderation_status: p.moderation_status,
            status: p.status,
            created_at: p.created_at,
            seller_id: p.seller_id,
            profiles: { 
              display_name: seller?.display_name || 'Vendeur inconnu',
              verified_seller: seller?.verified_seller || false
            }
          };
        })
      );

      return productsWithSellers;
    }
  });

  // Fetch real orders data
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['marketplaceOrders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data?.map(o => ({
        id: o.id,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        profiles: { display_name: 'Acheteur', email: '' },
        products: { name: 'Produit', price: o.total_amount }
      })) || [];
    }
  });

  // Update product moderation status
  const updateProductStatus = useMutation({
    mutationFn: async ({ 
      productId, 
      action, 
      rejectionReason 
    }: { 
      productId: string; 
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('moderate-product', {
        body: { productId, action, rejectionReason }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceProducts'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceStats'] });
      toast({
        title: "Succès",
        description: "Produit modéré avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modération",
        variant: "destructive",
      });
      console.error('Product moderation error:', error);
    }
  });

  const getModerationBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, label: 'En attente' },
      approved: { variant: 'default' as const, label: 'Approuvé' },
      rejected: { variant: 'destructive' as const, label: 'Rejeté' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOrderStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, label: 'En attente' },
      completed: { variant: 'default' as const, label: 'Terminé' },
      cancelled: { variant: 'destructive' as const, label: 'Annulé' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (statsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Marketplace</h1>
          <p className="text-muted-foreground">
            Gérez les produits, commandes et vendeurs de la marketplace
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="moderation" className="relative">
            Modération
            {stats && stats.pendingModeration > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {stats.pendingModeration}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="sellers">Vendeurs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingModeration || 0} en attente • {stats?.approvedProducts || 0} approuvés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingOrders || 0} en cours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendeurs Actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSellers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Vendeurs inscrits
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.totalRevenue || 0).toLocaleString()} CDF</div>
                <p className="text-xs text-muted-foreground">
                  Commandes terminées
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <ProductModerationQueue />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Modération des Produits</CardTitle>
              <CardDescription>
                Gérez les produits soumis par les vendeurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-4">Chargement des produits...</div>
              ) : (
                <div className="space-y-4">
                  {products?.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Par {product.profiles?.display_name || 'Vendeur inconnu'} • {product.price} CDF
                        </p>
                        <div className="flex items-center space-x-2">
                          {getModerationBadge(product.moderation_status || 'pending')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {product.moderation_status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProductStatus.mutate({ productId: product.id, action: 'approve' })}
                              disabled={updateProductStatus.isPending}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProductStatus.mutate({ productId: product.id, action: 'reject', rejectionReason: 'Rejeté par admin' })}
                              disabled={updateProductStatus.isPending}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Marketplace</CardTitle>
              <CardDescription>
                Suivi des commandes et gestion des litiges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-4">Chargement des commandes...</div>
              ) : (
                <div className="space-y-4">
                  {orders?.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">Commande #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles?.display_name} • {order.total_amount} CDF
                        </p>
                        <div className="flex items-center space-x-2">
                          {getOrderStatusBadge(order.status || 'pending')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-6">
          <SellerVerificationPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ProductAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}