import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Package, Share2, Edit, Eye } from "lucide-react";
import { ProductShareButtons } from "@/components/marketplace/ProductShareButtons";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: any;
  status: string;
  moderation_status: string;
  rejection_reason?: string;
  created_at: string;
  category: string;
  stock_count: number;
}

export default function MyProducts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadMyProducts();
  }, [user]);

  const loadMyProducts = async () => {
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
    } catch (error: any) {
      console.error('Erreur chargement produits:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.moderation_status === filter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '🕐 En attente', variant: 'secondary' as const },
      approved: { label: '✅ Approuvé', variant: 'default' as const },
      rejected: { label: '❌ Rejeté', variant: 'destructive' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/client')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Mes Produits</h1>
                <p className="text-sm text-muted-foreground">
                  {products.length} produit(s) au total
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/client')}>
              Nouveau produit
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Tous', count: products.length },
            { key: 'pending', label: 'En attente', count: products.filter(p => p.moderation_status === 'pending').length },
            { key: 'approved', label: 'Approuvés', count: products.filter(p => p.moderation_status === 'approved').length },
            { key: 'rejected', label: 'Rejetés', count: products.filter(p => p.moderation_status === 'rejected').length },
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key as any)}
              className="whitespace-nowrap"
            >
              {label} ({count})
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4">
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all'
                ? "Vous n'avez pas encore créé de produit"
                : `Aucun produit ${filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvé' : 'rejeté'}`}
            </p>
            <Button onClick={() => navigate('/client')}>
              Créer mon premier produit
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {/* Product Image */}
                <div className="aspect-square bg-muted relative">
                  {product.images && Array.isArray(product.images) && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(product.moderation_status)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                    <p className="text-2xl font-bold text-primary">{product.price} CDF</p>
                  </div>

                  {product.rejection_reason && (
                    <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
                      <strong>Raison du rejet:</strong> {product.rejection_reason}
                    </div>
                  )}

                  {product.moderation_status === 'pending' && (
                    <div className="p-2 bg-secondary/50 rounded text-sm">
                      ⏳ Modération en cours (24-48h)
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {product.moderation_status === 'approved' && (
                      <>
                        <ProductShareButtons
                          vendorId={user.id}
                          productId={product.id}
                          productTitle={product.title}
                          productPrice={product.price}
                          productImage={Array.isArray(product.images) ? product.images[0] : ''}
                          sellerName={user?.email || 'Vendeur'}
                        />
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </>
                    )}
                    {product.moderation_status === 'rejected' && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Créé le {new Date(product.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
