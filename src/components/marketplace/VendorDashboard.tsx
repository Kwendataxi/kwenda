import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VendorDashboardProps {
  onProductUpdate: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ onProductUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

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

      // Load vendor orders
      const { data: vendorOrders, error: ordersError } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products!inner(title, price, images)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setMyProducts(products || []);
      setOrders(vendorOrders || []);

      // Calculate stats
      const activeProducts = products?.filter(p => p.status === 'active').length || 0;
      const totalRevenue = vendorOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingOrders = vendorOrders?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalProducts: products?.length || 0,
        activeProducts,
        totalOrders: vendorOrders?.length || 0,
        totalRevenue,
        pendingOrders
      });

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

  const confirmOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('seller_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Commande confirmée',
        description: 'La commande a été confirmée et sera traitée',
      });

      loadVendorData();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de confirmer la commande',
        variant: 'destructive',
      });
    }
  };

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Produits</p>
              <p className="text-2xl font-bold">{stats.activeProducts}/{stats.totalProducts}</p>
            </div>
            <Store className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Commandes</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <Package className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenus</p>
              <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FC</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

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

  const renderOrdersTab = () => (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{order.marketplace_products?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Commande #{order.id.slice(0, 8)}
                </p>
              </div>
              <Badge variant={
                order.status === 'pending' ? 'destructive' :
                order.status === 'confirmed' ? 'default' :
                order.status === 'delivered' ? 'secondary' : 'outline'
              }>
                {order.status === 'pending' ? 'En attente' :
                 order.status === 'confirmed' ? 'Confirmée' :
                 order.status === 'delivered' ? 'Livrée' : order.status}
              </Badge>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span>Quantité: {order.quantity}</span>
              <span className="font-semibold">{order.total_amount.toLocaleString()} FC</span>
            </div>

            {order.delivery_address && (
              <p className="text-sm text-muted-foreground mt-1">
                Livraison: {order.delivery_address}
              </p>
            )}

            {order.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  onClick={() => confirmOrder(order.id)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirmer
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Refuser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
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
      {renderStatsCards()}
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Mes Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-4">
          {renderProductsTab()}
        </TabsContent>
        
        <TabsContent value="orders" className="mt-4">
          {renderOrdersTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};