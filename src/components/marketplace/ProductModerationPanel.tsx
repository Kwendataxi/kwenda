import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, CheckCircle, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  seller_id: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  seller?: {
    display_name: string;
    email: string;
  };
}

export const ProductModerationPanel: React.FC = () => {
  const { toast } = useToast();
  const { formatCurrency } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadProducts();
  }, [filterStatus]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('marketplace_products')
        .select('*, seller:profiles!marketplace_products_seller_id_fkey(display_name, email)')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('moderation_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts((data as any[]) || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const moderateProduct = async (productId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setActionLoading(true);

      const { data, error } = await supabase.functions.invoke('moderate-product', {
        body: {
          productId,
          action,
          rejectionReason: reason
        }
      });

      if (error) throw error;

      toast({
        title: action === 'approve' ? 'Produit approuvé' : 'Produit rejeté',
        description: action === 'approve' 
          ? 'Le produit est maintenant visible sur la marketplace'
          : 'Le vendeur a été notifié du rejet',
      });

      setSelectedProduct(null);
      setRejectionReason('');
      loadProducts();
    } catch (error) {
      console.error('Error moderating product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modérer le produit',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approuvé' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeté' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modération des produits</h2>
          <p className="text-muted-foreground">Approuver ou rejeter les produits soumis par les vendeurs</p>
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les produits</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="space-y-2 p-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun produit à modérer</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {filterStatus === 'pending' 
                ? 'Tous les produits ont été traités'
                : `Aucun produit ${filterStatus === 'approved' ? 'approuvé' : 'rejeté'} pour le moment`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(product.moderation_status)}
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{formatCurrency(product.price, 'CDF')}</span>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Vendeur: {product.seller?.display_name || 'Inconnu'}
                </div>
                {product.rejection_reason && (
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-xs text-destructive">{product.rejection_reason}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  {product.moderation_status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => moderateProduct(product.id, 'approve')}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setRejectionReason('');
                        }}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={!!selectedProduct && !rejectionReason} onOpenChange={() => {
        setSelectedProduct(null);
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raison du rejet</label>
              <Textarea
                placeholder="Expliquez pourquoi ce produit est rejeté..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Images de mauvaise qualité ou inappropriées')}
              >
                Images inappropriées
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Description insuffisante ou trompeuse')}
              >
                Description incorrecte
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Prix anormalement élevé ou suspect')}
              >
                Prix suspect
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Produit interdit ou contrefait')}
              >
                Produit interdit
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedProduct(null);
              setRejectionReason('');
            }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedProduct && rejectionReason) {
                  moderateProduct(selectedProduct.id, 'reject', rejectionReason);
                }
              }}
              disabled={!rejectionReason || actionLoading}
            >
              Rejeter le produit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};