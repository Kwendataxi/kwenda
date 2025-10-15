import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Star, Package, Loader2, Store, Heart, ThumbsUp, Share2, X, Camera } from 'lucide-react';
import { ModernProductCard } from '@/components/marketplace/ModernProductCard';
import { VendorShopShareButtons } from '@/components/marketplace/VendorShopShareButtons';
import { useToast } from '@/hooks/use-toast';

interface VendorProfile {
  id: string;
  user_id: string;
  shop_name: string;
  shop_description: string | null;
  shop_banner_url: string | null;
  shop_logo_url: string | null;
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
  created_at: string;
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);

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

      // Check if current user is subscribed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subData } = await supabase
          .from('vendor_subscriptions')
          .select('is_active')
          .eq('subscriber_id', user.id)
          .eq('vendor_id', vendorId)
          .maybeSingle();
        
        setIsSubscribed(subData?.is_active || false);
      }

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
          created_at,
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
        created_at: p.created_at,
        seller: {
          id: p.seller_id,
          display_name: p.profiles?.display_name || 'Vendeur'
        }
      }));

      setProducts(formattedProducts);

      // Get reviews count (approximation based on rating)
      setTotalReviews(profileData.average_rating > 0 ? Math.ceil(profileData.total_sales * 0.3) : 0);
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

  const handleSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Connectez-vous',
        description: 'Vous devez être connecté pour vous abonner.'
      });
      return;
    }

    if (!profile) return;

    try {
      if (isSubscribed) {
        // Unsubscribe
        await supabase
          .from('vendor_subscriptions')
          .update({ is_active: false })
          .eq('subscriber_id', user.id)
          .eq('vendor_id', profile.user_id);
        
        toast({
          title: 'Désabonné',
          description: 'Vous ne recevrez plus de notifications de cette boutique.'
        });
      } else {
        // Subscribe
        await supabase
          .from('vendor_subscriptions')
          .insert({
            customer_id: user.id,
            subscriber_id: user.id,
            vendor_id: profile.user_id,
            is_active: true
          });
        
        toast({
          title: '✅ Abonné !',
          description: `Vous recevrez des notifications des nouveautés de ${profile.shop_name}.`
        });
      }
      
      // Reload to update follower count
      loadVendorData();
    } catch (error) {
      console.error('Subscribe error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier l\'abonnement.'
      });
    }
  };

  const isNewProduct = (createdAt: string) => {
    const productDate = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - productDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
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
      {/* Header Boutique Style Yango */}
      <header className="bg-card border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Nom Boutique */}
            <div className="flex items-center gap-3">
              {profile.shop_logo_url ? (
                <img 
                  src={profile.shop_logo_url} 
                  alt={profile.shop_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{profile.shop_name}</h1>
                {profile.shop_description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {profile.shop_description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/marketplace')}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner (si disponible) */}
      {profile.shop_banner_url && (
        <div className="w-full h-32 md:h-48 overflow-hidden">
          <img
            src={profile.shop_banner_url}
            alt={profile.shop_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistiques Style Yango */}
        <div className="flex items-center justify-around bg-card rounded-lg p-4 border">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">Évaluations</span>
            </div>
            <div className="text-lg font-bold">{totalReviews}</div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">Note</span>
            </div>
            <div className="text-lg font-bold">{profile.average_rating.toFixed(1)}</div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-xs">Livraisons</span>
            </div>
            <div className="text-lg font-bold">{profile.total_sales}</div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-xs">Abonnés</span>
            </div>
            <div className="text-lg font-bold">{profile.follower_count}</div>
          </div>
        </div>

        {/* Bouton S'abonner */}
        <Button
          variant={isSubscribed ? "outline" : "default"}
          size="lg"
          className="w-full"
          onClick={handleSubscribe}
        >
          <Heart className={`h-5 w-5 mr-2 ${isSubscribed ? 'fill-current' : ''}`} />
          {isSubscribed ? 'Abonné ✓' : 'S\'abonner'}
        </Button>

        {/* Grille Produits */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits ({products.length})
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => (
                <div key={product.id} className="relative">
                  {/* Badge NOUVEAUTÉ */}
                  {isNewProduct(product.created_at) && (
                    <div className="absolute top-2 left-2 z-10 bg-green-500 text-white px-2 py-0.5 text-xs font-bold rounded">
                      NOUVEAUTÉ
                    </div>
                  )}
                  <ModernProductCard
                    product={{
                      id: product.id,
                      name: product.title,
                      price: product.price,
                      image: product.images[0] || '/placeholder.svg',
                      rating: profile.average_rating,
                      reviews: totalReviews,
                      seller: product.seller.display_name,
                      category: product.category,
                      inStock: product.in_stock
                    }}
                    onAddToCart={() => {}}
                    onViewDetails={() => navigate(`/marketplace/product/${product.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Partage */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager cette boutique</DialogTitle>
          </DialogHeader>
          <VendorShopShareButtons
            vendorId={profile.id}
            vendorName={profile.shop_name}
            productCount={products.length}
            rating={profile.average_rating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorShop;
