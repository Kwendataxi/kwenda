import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Star, Package, Loader2, Store, Heart, ThumbsUp, Share2, X, Camera } from 'lucide-react';
import { YangoProductCard } from '@/components/marketplace/YangoProductCard';
import { VendorShopShareButtons } from '@/components/marketplace/VendorShopShareButtons';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useProductFavorites } from '@/hooks/useProductFavorites';

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
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Hook pour gérer les favoris
  const { isFavorite, toggleFavorite } = useProductFavorites(user?.id);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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

  const handleAddToCart = (product: Product) => {
    if (!product.in_stock) {
      toast({
        variant: 'destructive',
        title: 'Produit indisponible',
        description: 'Ce produit est actuellement en rupture de stock.'
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.images[0] || '/placeholder.svg',
      seller: product.seller.display_name,
      seller_id: product.seller.id,
      category: product.category,
      isAvailable: product.in_stock
    });

    toast({
      title: '✅ Ajouté au panier',
      description: `${product.title} a été ajouté à votre panier.`
    });
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
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <Camera className="h-7 w-7 text-muted-foreground" />
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
              {/* Avatar Vendeur */}
              {profile.shop_name && (
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {profile.shop_name.charAt(0).toUpperCase()}
                </div>
              )}
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
        <div className="grid grid-cols-4 gap-2 bg-card rounded-lg p-4 border">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 mb-1">
              <ThumbsUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{totalReviews}</span>
            </div>
            <span className="text-xs font-medium">Évaluation</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">{profile.average_rating.toFixed(1)}</span>
            </div>
            <span className="text-xs font-medium">Note</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 mb-1">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">{profile.total_sales}</span>
            </div>
            <span className="text-xs font-medium">Livraisons</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 mb-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">{profile.follower_count}</span>
            </div>
            <span className="text-xs font-medium">Abonnés</span>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <YangoProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images[0] || '/placeholder.svg',
                    isNew: isNewProduct(product.created_at),
                    inStock: product.in_stock
                  }}
                  isFavorite={isFavorite(product.id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                />
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
