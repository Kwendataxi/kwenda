import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Star, Package, Loader2, Store, Heart, ThumbsUp, Share2, X, Camera, Home, Shield, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { YangoProductCard } from '@/components/marketplace/YangoProductCard';
import { AiShopperProductCard } from '@/components/marketplace/AiShopperProductCard';
import { useProductPromotions } from '@/hooks/useProductPromotions';
import { VendorShopShareButtons } from '@/components/marketplace/VendorShopShareButtons';
import { VendorRatingDialog } from '@/components/marketplace/VendorRatingDialog';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useProductFavorites } from '@/hooks/useProductFavorites';
import { ShareMetaTags } from '@/components/seo/ShareMetaTags';
import { getVendorShopUrl } from '@/config/appUrl';
import { validateVendorIdOrRedirect } from '@/utils/vendorValidation';
import { useAuth } from '@/hooks/useAuth';

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
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { calculateDiscount, getOriginalPrice } = useProductPromotions();
  
  // ✅ CORRECTION 1 : Utiliser useAuth au lieu de useEffect séparé
  const { user } = useAuth();

  // Hook pour gérer les favoris
  const { isFavorite, toggleFavorite } = useProductFavorites(user?.id);

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
      // ✅ CORRECTION PHASE 1: Charger directement depuis vendor_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (profileError || !profileData) {
        console.error('[VendorShop] Vendor not found:', { vendorId, error: profileError });
        toast({
          variant: 'destructive',
          title: '🏪 Boutique introuvable',
          description: 'Cette boutique n\'existe pas ou a été supprimée.'
        });
        navigate('/marketplace');
        return;
      }

      // ✅ Utiliser les vraies valeurs de la DB avec fallback sur 0
      const vendorProfile = {
        ...profileData,
        total_sales: profileData.total_sales || 0,
        average_rating: profileData.average_rating || 0,
        follower_count: profileData.follower_count || 0,
        total_reviews: 0
      };

      console.log('[VendorShop] ✅ Profile loaded:', {
        shop_name: vendorProfile.shop_name,
        user_id: vendorProfile.user_id,
        total_sales: vendorProfile.total_sales,
        average_rating: vendorProfile.average_rating,
        products_expected: 'loading...'
      });

      setProfile(vendorProfile as VendorProfile);
      setTotalReviews(0);

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

      // Load vendor products with correct JOIN
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
          status,
          vendor_profiles!inner(
            shop_name,
            shop_logo_url
          )
        `)
        .eq('seller_id', vendorId)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // ✅ CORRECTION PHASE 2: Helper pour parser les images correctement
      const parseImages = (images: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) return images;
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [images];
          } catch {
            return [images];
          }
        }
        return [];
      };

      const formattedProducts = productsData.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        images: parseImages(p.images),
        category: p.category,
        stock_count: p.stock_count || 0,
        created_at: p.created_at,
        seller: {
          id: p.seller_id,
          display_name: p.vendor_profiles?.shop_name || 'Vendeur'
        }
      }));

      console.log('[VendorShop] ✅ Products loaded:', {
        count: formattedProducts.length,
        shopName: formattedProducts[0]?.seller?.display_name,
        firstProductTitle: formattedProducts[0]?.title,
        firstProductImages: formattedProducts[0]?.images?.length
      });

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
    // ✅ CORRECTION 2 : Utiliser user directement depuis useAuth
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
      const newState = !isSubscribed;
      
      // ✅ CORRECTION 3 : Logs détaillés pour debugging
      console.log('[VendorShop] Subscribe action:', {
        action: newState ? 'SUBSCRIBE' : 'UNSUBSCRIBE',
        userId: user.id,
        vendorId: profile.user_id,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase
        .from('vendor_subscriptions')
        .upsert({
          customer_id: user.id,
          subscriber_id: user.id,
          vendor_id: profile.user_id,
          is_active: newState
        }, { 
          onConflict: 'customer_id,vendor_id'
        });

      if (error) {
        // ✅ CORRECTION 4 : Logs d'erreur détaillés
        console.error('[VendorShop] ❌ Subscription error:', {
          error,
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          userId: user.id,
          vendorId: profile.user_id
        });
        throw error;
      }
      
      setIsSubscribed(newState);
      console.log('[VendorShop] ✅ Subscription updated successfully');
      
      toast({
        title: newState ? '🎉 Abonné !' : 'Désabonné',
        description: newState 
          ? `Vous recevrez des notifications des nouveautés de ${profile.shop_name}.`
          : 'Vous ne recevrez plus de notifications de cette boutique.'
      });
      
      // Recharger les données pour voir le compteur mis à jour par le trigger
      setTimeout(() => loadVendorData(), 300);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur d\'abonnement',
        description: error?.message || 'Une erreur est survenue. Réessayez.'
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

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    toast({
      title: favorites.includes(productId) ? '💔 Retiré des favoris' : '❤️ Ajouté aux favoris',
      duration: 2000,
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
      
      {/* Header Boutique Moderne */}
      <header className="bg-gradient-to-br from-background via-muted/30 to-background border-b sticky top-0 z-20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Nom Boutique avec badge vérifié */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {profile.shop_logo_url ? (
                  <img 
                    src={profile.shop_logo_url} 
                    alt={profile.shop_name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-primary/20 shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                    <Store className="h-7 w-7 text-primary" />
                  </div>
                )}
                {/* Badge vérifié */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {profile.shop_name}
                </h1>
                {profile.shop_description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
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
        {/* Statistiques Modernes */}
        <div className="grid grid-cols-4 gap-3 bg-gradient-to-br from-card to-muted/20 rounded-2xl p-5 border shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{products.length}</div>
              <div className="text-xs text-muted-foreground">Produits</div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{(profile.total_sales || 0).toLocaleString()} CDF</div>
              <div className="text-xs text-muted-foreground">Ventes</div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowRatingDialog(true)}
            className="flex flex-col items-center gap-2 hover:scale-105 transition-transform active:scale-95"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{profile.average_rating?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">👆 Notez</div>
            </div>
          </button>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{profile.follower_count || 0}</div>
              <div className="text-xs text-muted-foreground">Abonnés</div>
            </div>
          </div>
        </div>

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
            className={`w-full transition-all ${
              isSubscribed ? 'border-green-500 text-green-600 dark:text-green-400' : ''
            }`}
            onClick={handleSubscribe}
          >
            <Heart className={`h-5 w-5 mr-2 ${isSubscribed ? 'fill-current text-red-500' : ''}`} />
            {isSubscribed ? '✓ Abonné' : 'S\'abonner'}
          </Button>
        )}

        {/* Grille Produits */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits ({products.length})
          </h2>
          
          {products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Aucun produit disponible</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette boutique n'a pas encore ajouté de produits.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/marketplace')}
                    className="gap-2"
                  >
                    <Store className="h-4 w-4" />
                    Découvrir d'autres boutiques
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => {
                const discount = calculateDiscount({
                  ...product,
                  seller_id: product.seller.id,
                  inStock: product.stock_count > 0,
                  stockCount: product.stock_count,
                  seller: product.seller,
                  image: product.images[0] || '/placeholder.svg',
                  images: product.images,
                  coordinates: undefined,
                  rating: 0,
                  reviews: 0,
                  moderation_status: 'approved',
                  popularityScore: 0,
                  viewCount: 0,
                  salesCount: 0,
                  condition: 'new',
                  location: ''
                });
                const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : undefined;

                return (
                  <AiShopperProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      originalPrice,
                      discount,
                      image: product.images[0] || '/placeholder.svg',
                      seller: product.seller,
                      seller_id: product.seller.id,
                      inStock: product.stock_count > 0,
                      stockCount: product.stock_count
                    }}
                    onAddToCart={() => handleAddToCart(product)}
                    onQuickView={() => {
                      toast({
                        title: '👁️ Aperçu rapide',
                        description: 'Fonctionnalité bientôt disponible'
                      });
                    }}
                    onToggleFavorite={() => handleToggleFavorite(product.id)}
                    isFavorite={favorites.includes(product.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Notation Vendeur */}
      <VendorRatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        vendorId={profile.user_id}
        vendorName={profile.shop_name}
        vendorLogo={profile.shop_logo_url || undefined}
        onSuccess={() => {
          toast({
            title: '✅ Merci pour votre avis !',
            description: 'Votre note a été enregistrée avec succès.'
          });
          loadVendorData();
        }}
      />

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
    </div>
  );
};

export default VendorShop;
