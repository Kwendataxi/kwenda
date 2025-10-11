import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Package, Loader2, Store } from 'lucide-react';
import { ModernProductCard } from '@/components/marketplace/ModernProductCard';
import { useToast } from '@/hooks/use-toast';

interface VendorProfile {
  id: string;
  user_id: string;
  shop_name: string;
  shop_description: string | null;
  shop_banner_url: string | null;
  total_sales: number;
  average_rating: number;
  follower_count: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  in_stock: boolean;
  seller: {
    id: string;
    display_name: string;
  };
}

const VendorShop: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (vendorId) {
      loadVendorData();
    }
  }, [vendorId]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      // Load vendor profile
      const { data: profileData, error: profileError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (profileError) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Boutique introuvable.'
        });
        navigate('/marketplace');
        return;
      }

      setProfile(profileData);

      // Load vendor products
      const { data: productsData, error: productsError } = await supabase
        .from('marketplace_products')
        .select(`
          id,
          title,
          description,
          price,
          images,
          category,
          in_stock,
          seller_id,
          profiles!marketplace_products_seller_id_fkey(display_name)
        `)
        .eq('seller_id', vendorId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const formattedProducts = productsData.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        images: p.images || [],
        category: p.category,
        in_stock: p.in_stock,
        seller: {
          id: p.seller_id,
          display_name: p.profiles?.display_name || 'Vendeur'
        }
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger la boutique.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glassmorphism border-b border-border/20 py-4">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au marketplace
          </Button>
        </div>
      </header>

      {/* Banner */}
      {profile.shop_banner_url && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img
            src={profile.shop_banner_url}
            alt={profile.shop_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Vendor Info */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {profile.shop_name}
                </h1>
                {profile.shop_description && (
                  <p className="text-muted-foreground mb-4">
                    {profile.shop_description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{products.length} produits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{profile.average_rating.toFixed(1)}/5</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            Produits disponibles ({products.length})
          </h2>
          {products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucun produit disponible pour le moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ModernProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.title,
                    price: product.price,
                    image: product.images[0] || '/placeholder.svg',
                    rating: profile.average_rating,
                    reviews: 0,
                    seller: product.seller.display_name,
                    category: product.category,
                    inStock: product.in_stock
                  }}
                  onAddToCart={() => {}}
                  onViewDetails={() => navigate(`/marketplace/product/${product.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorShop;
