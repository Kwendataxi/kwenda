import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { useVendorEarnings } from '@/hooks/useVendorEarnings';
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
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VendorNotificationBadge from './VendorNotificationBadge';
import VendorOrderConfirmation from './VendorOrderConfirmation';
import VendorRevenueDashboard from './VendorRevenueDashboard';

interface VendorDashboardProps {
  onProductUpdate: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ onProductUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
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

  useEffect(() => {
    if (user) {
      loadVendorData();
    }
  }, [user]);

  const loadVendorData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load vendor products
      const { data: products, error: productsError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Load orders awaiting confirmation
      const { data: pendingOrders, error: ordersError } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products!inner(title, price, images),
          profiles!marketplace_orders_buyer_id_fkey(display_name, phone_number)
        `)
        .eq('seller_id', user.id)
        .eq('vendor_confirmation_status', 'awaiting_confirmation')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setMyProducts(products || []);
      setOrdersForConfirmation(pendingOrders || []);

    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos données vendeur',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const renderProductsTab = () => (
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

  const renderConfirmationTab = () => (
    <VendorOrderConfirmation 
      orders={ordersForConfirmation}
      onOrderUpdate={handleOrderUpdate}
    />
  );

  const renderRevenueTab = () => (
    <VendorRevenueDashboard />
  );

  if (loading) {
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

  return (
    <div>
      {/* Header with notification badge */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tableau de bord vendeur</h2>
        <VendorNotificationBadge />
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