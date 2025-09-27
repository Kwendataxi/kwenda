import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, ShoppingCart, Users, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function AdminMarketplaceManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch marketplace statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['marketplaceStats'],
    queryFn: async () => {
      // Use existing tables with mock data for marketplace stats
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('id, user_type'),
        supabase.from('activity_logs').select('id, activity_type, amount').eq('activity_type', 'marketplace_order')
      ]);

      const profiles = profilesRes.data || [];
      const orders = ordersRes.data || [];

      return {
        totalProducts: 45, // Mock data
        pendingProducts: 12, // Mock data  
        totalOrders: orders.length,
        pendingOrders: Math.floor(orders.length * 0.3),
        totalSellers: profiles.filter(p => p.user_type === 'seller').length || 8,
        totalRevenue: orders.reduce((sum, o) => sum + (o.amount || 0), 0)
      };
    },
    refetchInterval: 30000
  });

  // Fetch mock products data
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['marketplaceProducts', searchTerm],
    queryFn: async () => {
      // Mock products data
      const mockProducts = [
        {
          id: '1',
          name: 'Téléphone Samsung Galaxy',
          price: 450000,
          status: 'pending',
          created_at: new Date().toISOString(),
          profiles: { display_name: 'Jean Mukendi', email: 'jean@example.com' }
        },
        {
          id: '2', 
          name: 'Ordinateur Dell Laptop',
          price: 800000,
          status: 'approved',
          created_at: new Date().toISOString(),
          profiles: { display_name: 'Marie Tshala', email: 'marie@example.com' }
        },
        {
          id: '3',
          name: 'Chaussures Nike Air',
          price: 120000,
          status: 'pending',
          created_at: new Date().toISOString(),
          profiles: { display_name: 'Paul Mbuyi', email: 'paul@example.com' }
        }
      ];

      if (searchTerm) {
        return mockProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return mockProducts;
    }
  });

  // Fetch mock orders data
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['marketplaceOrders'],
    queryFn: async () => {
      // Mock orders data
      return [
        {
          id: '1',
          total_amount: 450000,
          status: 'completed',
          created_at: new Date().toISOString(),
          profiles: { display_name: 'Client A', email: 'clienta@example.com' },
          products: { name: 'Téléphone Samsung', price: 450000 }
        },
        {
          id: '2',
          total_amount: 120000,
          status: 'pending',
          created_at: new Date().toISOString(),
          profiles: { display_name: 'Client B', email: 'clientb@example.com' },
          products: { name: 'Chaussures Nike', price: 120000 }
        }
      ];
    }
  });

  // Update product status (mock)
  const updateProductStatus = useMutation({
    mutationFn: async ({ productId, status }: { productId: string; status: string }) => {
      // Mock update - in real implementation would update the products table
      console.log('Updating product', productId, 'to status', status);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceProducts'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceStats'] });
      toast({
        title: "Succès",
        description: "Statut du produit mis à jour",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du produit",
        variant: "destructive",
      });
      console.error('Product update error:', error);
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, label: 'En attente' },
      approved: { variant: 'default' as const, label: 'Approuvé' },
      rejected: { variant: 'destructive' as const, label: 'Rejeté' },
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="sellers">Vendeurs</TabsTrigger>
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
                  {stats?.pendingProducts || 0} en attente de modération
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
                          {getStatusBadge(product.status || 'pending')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {product.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProductStatus.mutate({ productId: product.id, status: 'approved' })}
                              disabled={updateProductStatus.isPending}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProductStatus.mutate({ productId: product.id, status: 'rejected' })}
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
                          {getStatusBadge(order.status || 'pending')}
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
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Vendeurs</CardTitle>
              <CardDescription>
                Surveillance et modération des vendeurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Fonctionnalité en développement
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}