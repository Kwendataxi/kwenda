import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { useVendorEarnings } from '@/hooks/useVendorEarnings';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Bell,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TouchOptimizedInterface } from '@/components/mobile/TouchOptimizedInterface';
import VendorNotificationBadge from './VendorNotificationBadge';
import VendorOrderConfirmation from './VendorOrderConfirmation';
import VendorOrderStepsManager from './VendorOrderStepsManager';
import VendorRevenueDashboard from './VendorRevenueDashboard';
import { MobileVendorHeader } from './mobile/MobileVendorHeader';
import { MobileVendorStats } from './mobile/MobileVendorStats';
import { MobileVendorTabs } from './mobile/MobileVendorTabs';
import { MobileProductCard } from './mobile/MobileProductCard';

interface VendorDashboardProps {
  onProductUpdate: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ onProductUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Use new hooks for notifications and earnings
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading,
    markAsRead,
    markAsAcknowledged,
    markAllAsRead 
  } = useVendorNotifications();
  
  const { 
    earnings, 
    summary, 
    loading: earningsLoading,
    markAsPaid, 
    refetch: refetchEarnings 
  } = useVendorEarnings();
  
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [ordersForConfirmation, setOrdersForConfirmation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('products');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadVendorData();
    }
  }, [user]);

  const loadVendorData = async (isRefresh = false) => {
    if (!user) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Load vendor products
      const { data: products, error: productsError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error loading products:', productsError);
        toast({
          title: 'Erreur',
          description: 'Erreur lors du chargement des produits',
          variant: 'destructive',
        });
      } else {
        setMyProducts(products || []);
      }

      // Load orders awaiting confirmation (simplified query)
      const { data: pendingOrders, error: ordersError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('seller_id', user.id)
        .eq('vendor_confirmation_status', 'awaiting_confirmation')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        toast({
          title: 'Erreur',
          description: 'Erreur lors du chargement des commandes',
          variant: 'destructive',
        });
      } else {
        // Enrichir les commandes avec les données des produits et profils séparément
        const enrichedOrders = await Promise.all(
          (pendingOrders || []).map(async (order) => {
            try {
              // Récupérer les données du produit
              const { data: product } = await supabase
                .from('marketplace_products')
                .select('title, price, images')
                .eq('id', order.product_id)
                .single();
              
              // Récupérer les données du profil acheteur
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, phone_number')
                .eq('user_id', order.buyer_id)
                .single();
              
              return {
                ...order,
                marketplace_products: product || { title: 'Produit inconnu', price: 0, images: [] },
                profiles: profile || { display_name: 'Utilisateur inconnu', phone_number: '' }
              };
            } catch (error) {
              console.error('Error enriching order:', error);
              return {
                ...order,
                marketplace_products: { title: 'Produit inconnu', price: 0, images: [] },
                profiles: { display_name: 'Utilisateur inconnu', phone_number: '' }
              };
            }
          })
        );
        
        setOrdersForConfirmation(enrichedOrders);
      }

    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur générale lors du chargement des données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: newStatus })
        .eq('id', productId)
        .eq('seller_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: `Produit ${newStatus === 'active' ? 'activé' : 'désactivé'}`,
      });

      loadVendorData();
      onProductUpdate();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès',
      });

      loadVendorData();
      onProductUpdate();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive',
      });
    }
  };

  const handleOrderUpdate = () => {
    loadVendorData();
    refetchEarnings();
  };

  const renderStatsCards = () => {
    const activeProducts = myProducts.filter(p => p.status === 'active').length;
    const totalProducts = myProducts.length;
    
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{activeProducts}/{totalProducts}</p>
              </div>
              <Store className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmations</p>
                <p className="text-2xl font-bold">{ordersForConfirmation.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus effectifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.paid.amount.toLocaleString()} FC
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-500">
                  {(summary.pending.amount + summary.confirmed.amount).toLocaleString()} FC
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProductsTab = () => {
    if (isMobile) {
      return (
        <div className="px-4 pb-20">
          {myProducts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun produit</p>
              </CardContent>
            </Card>
          ) : (
            myProducts.map(product => (
              <MobileProductCard
                key={product.id}
                product={product}
                onView={(id) => console.log('View product', id)}
                onEdit={(id) => console.log('Edit product', id)}
                onDelete={deleteProduct}
                onToggleStatus={toggleProductStatus}
              />
            ))
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {myProducts.map(product => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <img
                  src={Array.isArray(product.images) && product.images.length > 0 
                    ? product.images[0] 
                    : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=100&h=100&fit=crop'}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{product.title}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <p className="font-semibold text-primary">{product.price.toLocaleString()} FC</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Switch
                        checked={product.status === 'active'}
                        onCheckedChange={() => toggleProductStatus(product.id, product.status)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderConfirmationTab = () => {
    const confirmedOrders = ordersForConfirmation.filter(order => 
      ['confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_driver'].includes(order.status)
    );

    return (
      <div className={isMobile ? "px-4 pb-20" : ""}>
        <div className="space-y-6">
          <VendorOrderConfirmation 
            orders={ordersForConfirmation.filter(order => 
              order.vendor_confirmation_status === 'awaiting_confirmation'
            )}
            onOrderUpdate={handleOrderUpdate}
          />
          
          {confirmedOrders.length > 0 && (
            <VendorOrderStepsManager
              orders={confirmedOrders}
              onOrderUpdate={handleOrderUpdate}
            />
          )}
        </div>
      </div>
    );
  };

  const renderRevenueTab = () => (
    <div className={isMobile ? "px-4 pb-20" : ""}>
      <VendorRevenueDashboard />
    </div>
  );

  const handleRefresh = async () => {
    await loadVendorData(true);
    await refetchEarnings();
  };

  const handleNotificationClick = () => {
    setCurrentTab('notifications');
  };

  const statsData = {
    activeProducts: myProducts.filter(p => p.status === 'active').length,
    totalProducts: myProducts.length,
    pendingConfirmations: ordersForConfirmation.length,
    effectiveRevenue: summary.paid.amount,
    pendingRevenue: summary.pending.amount + summary.confirmed.amount
  };

  if (loading) {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-background">
          <MobileVendorHeader title="Vendeur" />
          <MobileVendorStats stats={statsData} loading={true} />
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-card rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <TouchOptimizedInterface enableSwipeGestures={false}>
        <div className="min-h-screen bg-background">
          <MobileVendorHeader 
            title="Tableau de bord"
            notificationCount={unreadCount}
            onNotificationClick={handleNotificationClick}
          />

          <MobileVendorStats stats={statsData} loading={earningsLoading} />

          <div className="sticky top-14 z-30">
            <MobileVendorTabs
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              confirmationCount={ordersForConfirmation.length}
              notificationCount={unreadCount}
              variant="horizontal"
              showLabels={false}
            />
          </div>

          <div className="min-h-[calc(100vh-180px)]">
            {currentTab === 'products' && renderProductsTab()}
            {currentTab === 'confirmations' && renderConfirmationTab()}
            {currentTab === 'revenue' && !earningsLoading && renderRevenueTab()}
            {currentTab === 'revenue' && earningsLoading && (
              <div className="px-4 pb-20 space-y-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Chargement des revenus...</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {currentTab === 'notifications' && !notificationsLoading && (
              <div className="px-4 pb-20 space-y-4">
                {notifications.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune notification</p>
                    </CardContent>
                  </Card>
                ) : (
                  notifications.map(notification => (
                    <Card key={notification.id} className={!notification.is_read ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                              className="flex-shrink-0 ml-2"
                            >
                              Marquer lu
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                
                {unreadCount > 0 && (
                  <div className="text-center">
                    <Button onClick={markAllAsRead} variant="outline" className="min-h-11">
                      Marquer tout comme lu
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pull to refresh indicator */}
          {refreshing && (
            <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-background/95 backdrop-blur rounded-full p-2 shadow-lg border">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}

          {/* Floating refresh button */}
          <div className="fixed bottom-4 right-4 z-40">
            <TouchOptimizedInterface>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-12 h-12 rounded-full shadow-lg"
                size="sm"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </TouchOptimizedInterface>
          </div>
        </div>
      </TouchOptimizedInterface>
    );
  }

  // Desktop Layout  
  return (
    <div>
      {/* Header with notification badge */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tableau de bord vendeur</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <VendorNotificationBadge />
        </div>
      </div>

      {renderStatsCards()}
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Mes Produits</TabsTrigger>
          <TabsTrigger value="confirmations" className="relative">
            Confirmations
            {ordersForConfirmation.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {ordersForConfirmation.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-4">
          {renderProductsTab()}
        </TabsContent>
        
        <TabsContent value="confirmations" className="mt-4">
          {renderConfirmationTab()}
        </TabsContent>
        
        <TabsContent value="revenue" className="mt-4">
          {renderRevenueTab()}
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-4">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune notification</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map(notification => (
                <Card key={notification.id} className={!notification.is_read ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Marquer lu
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            
            {unreadCount > 0 && (
              <div className="text-center">
                <Button onClick={markAllAsRead} variant="outline">
                  Marquer tout comme lu
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};