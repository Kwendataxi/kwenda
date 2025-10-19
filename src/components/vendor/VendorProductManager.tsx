import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Package, Edit, Eye, EyeOff, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface VendorProductManagerProps {
  onUpdate?: () => void;
}

export const VendorProductManager = ({ onUpdate }: VendorProductManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('marketplace_products')
        .update({ moderation_status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: currentStatus === 'active' ? "Produit désactivé" : "Produit activé",
        description: currentStatus === 'active'
          ? "Votre produit n'est plus visible sur la marketplace" 
          : "Votre produit est maintenant visible"
      });

      loadProducts();
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du produit",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      'approved': { variant: 'default', label: 'Approuvé', icon: CheckCircle },
      'pending': { variant: 'secondary', label: 'En attente', icon: Clock },
      'rejected': { variant: 'destructive', label: 'Rejeté', icon: XCircle }
    };

    const config = configs[status] || { variant: 'outline', label: status, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chargement des produits...</p>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">Vous n'avez pas encore de produits</p>
          <Button onClick={() => navigate('/vendeur/ajouter-produit')}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter mon premier produit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total produits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {products.filter(p => p.moderation_status === 'approved' || p.moderation_status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {products.filter(p => p.moderation_status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des produits */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              {product.main_image_url && (
                <img
                  src={product.main_image_url}
                  alt={product.title}
                  className="w-full h-40 object-cover rounded-md mb-3"
                  loading="lazy"
                />
              )}
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-2 mb-1">{product.title}</h3>
                  <p className="text-lg font-bold text-primary">{product.price} FC</p>
                </div>

                <div className="flex items-center justify-between">
                  {getStatusBadge(product.moderation_status)}
                  <span className="text-xs text-muted-foreground">
                    Stock: {product.stock_quantity || 0}
                  </span>
                </div>

                {product.moderation_status === 'rejected' && product.rejection_reason && (
                  <div className="p-2 bg-destructive/10 rounded text-xs text-destructive">
                    <strong>Raison:</strong> {product.rejection_reason}
                  </div>
                )}

                {(product.moderation_status === 'approved' || product.moderation_status === 'active' || product.moderation_status === 'inactive') && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label htmlFor={`active-${product.id}`} className="text-sm cursor-pointer">
                      {product.moderation_status === 'active' || product.moderation_status === 'approved' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Eye className="h-3 w-3" /> Visible
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <EyeOff className="h-3 w-3" /> Caché
                        </span>
                      )}
                    </Label>
                    <Switch
                      id={`active-${product.id}`}
                      checked={product.moderation_status === 'active' || product.moderation_status === 'approved'}
                      onCheckedChange={() => toggleProductStatus(product.id, product.moderation_status)}
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/vendeur/modifier-produit/${product.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
