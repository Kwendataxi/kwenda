import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Star, Package, Loader2, Store, Heart, ThumbsUp, Share2, X, Camera, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { YangoProductCard } from '@/components/marketplace/YangoProductCard';
import { VendorShopShareButtons } from '@/components/marketplace/VendorShopShareButtons';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useProductFavorites } from '@/hooks/useProductFavorites';
import { ShareMetaTags } from '@/components/seo/ShareMetaTags';
import { getVendorShopUrl } from '@/config/appUrl';
import { validateVendorIdOrRedirect } from '@/utils/vendorValidation';

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
  total_reviews?: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock_count: number;
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
  const [error, setError] = useState<string | null>(null);
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
      // ✅ PHASE 6: Logging pour monitoring
      console.log('[VendorShop] Opening shared shop:', {
        vendorId,
        isAuthenticated: !!user,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });

      // Validation UUID avant chargement
      if (!validateVendorIdOrRedirect(vendorId, navigate)) {
        setError('Lien de boutique invalide');
        setLoading(false);
        toast({
          variant: 'destructive',
          title: '⚠️ Lien invalide',
          description: 'Ce lien de boutique est incorrect. Demandez un nouveau lien au vendeur.',
        });
        return;
      }
      loadVendorData();
    }
  }, [vendorId, navigate, user, toast]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      // Load vendor profile from cache with real stats
      const { data: profileData, error: profileError } = await supabase
        .from('vendor_stats_cache')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (profileError || !profileData) {
        // Fallback to vendor_profiles if not in cache yet
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('user_id', vendorId)
          .single();

        if (fallbackError) {
          console.error('[VendorShop] Vendor not found:', { vendorId, error: fallbackError });
          toast({
            variant: 'destructive',
            title: '🏪 Boutique introuvable',
            description: 'Cette boutique n\'existe pas ou a été supprimée.'
          });
          navigate('/marketplace');
          return;
        }
        
        setProfile({
          ...fallbackData,
          total_sales: 0,
          average_rating: 0,
          follower_count: 0,
          total_reviews: 0
        } as any);
        setTotalReviews(0);
      } else {
        setProfile(profileData as any);
        setTotalReviews(profileData.total_reviews || 0);
      }

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
          stock_count,
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
        stock_count: p.stock_count || 0,
        created_at: p.created_at,
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

  const handleSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // ✅ PHASE 2: CTA pour visiteurs non connectés
    if (!user) {
      toast({
        title: '🔒 Connectez-vous',
        description: 'Créez un compte pour vous abonner à cette boutique.',
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/auth')}
            className="mt-2"
          >
            Se connecter
          </Button>
        )
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
        // Subscribe with confetti
        await supabase
          .from('vendor_subscriptions')
          .upsert({
            customer_id: user.id,
            subscriber_id: user.id,
            vendor_id: profile.user_id,
            is_active: true
          });
        
        setIsSubscribed(true);
        
        toast({
          title: '🎉 Abonné !',
          description: `Vous recevrez des notifications des nouveautés de ${profile.shop_name}.`
        });
      }
      
      // Reload to update follower count (will be auto-updated by trigger)
      setTimeout(() => loadVendorData(), 500);
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
    // ✅ PHASE 2: Vérifier si l'utilisateur est connecté
    if (!user) {
      toast({
        title: '🔒 Connectez-vous',
        description: 'Créez un compte pour ajouter des produits au panier.',
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/auth')}
            className="mt-2"
          >
            Se connecter
          </Button>
        )
      });
      return;
    }

    if (product.stock_count === 0) {
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
      isAvailable: product.stock_count > 0
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Lien invalide</h2>
            <p className="text-muted-foreground">
              Ce lien de boutique est incorrect ou expiré. Demandez un nouveau lien au vendeur.
            </p>
            <Button onClick={() => navigate('/marketplace')} className="w-full">
              Retour au Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      {profile && (
        <ShareMetaTags
          title={`Boutique ${profile.shop_name} | Kwenda Shop`}
          description={`Découvrez ${products.length} produits disponibles - Note ${profile.average_rating?.toFixed(1) || 0}/5`}
          image={profile.shop_logo_url || 'https://kwenda.app/kwenda-splash-logo.png'}
          url={getVendorShopUrl(profile.user_id)}
        />
      )}
      
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
              {/* Bouton Accueil Client */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app/client')}
                className="gap-2 hidden sm:flex"
              >
                <Home className="h-4 w-4" />
                Accueil
              </Button>
              
              {/* Avatar Vendeur */}
              {profile.shop_name && (
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {profile.shop_name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Partager</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/marketplace')}
                title="Retour Marketplace"
              >
                <Store className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                title="Fermer"
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

        {/* CTA Partage après stats */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  ❤️ Vous aimez cette boutique ?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Partagez-la avec vos proches pour leur faire découvrir !
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="gap-2 shrink-0"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ✅ PHASE 2: Bouton S'abonner adaptatif */}
        {!user ? (
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={() => navigate('/auth')}
          >
            <Heart className="h-5 w-5 mr-2" />
            Créer un compte pour s'abonner
          </Button>
        ) : (
          <Button
            variant={isSubscribed ? "outline" : "default"}
            size="lg"
            className="w-full"
            onClick={handleSubscribe}
          >
            <Heart className={`h-5 w-5 mr-2 ${isSubscribed ? 'fill-current' : ''}`} />
            {isSubscribed ? 'Abonné ✓' : 'S\'abonner'}
          </Button>
        )}

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
                    stockCount: product.stock_count || 0
                  }}
                  isFavorite={isFavorite(product.id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleFavorite={() => user ? toggleFavorite(product.id) : navigate('/auth')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Partage Amélioré */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            {/* Icône animée */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto"
            >
              <Share2 className="h-8 w-8 text-white" />
            </motion.div>
            
            <DialogTitle className="text-center text-xl">
              Partager {profile.shop_name}
            </DialogTitle>
            <DialogDescription className="text-center">
              Choisissez comment partager cette boutique
            </DialogDescription>
          </DialogHeader>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <VendorShopShareButtons
              vendorId={profile.user_id}
              vendorName={profile.shop_name}
              productCount={products.length}
              rating={profile.average_rating}
            />
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button - Partage Rapide */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-20 right-4 z-30"
      >
        <Button
          size="lg"
          onClick={() => setShowShareDialog(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all duration-300"
        >
          <Share2 className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
};

export default VendorShop;
