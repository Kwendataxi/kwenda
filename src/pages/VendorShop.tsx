import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Star, Package, Loader2, Store, Heart, ThumbsUp, Share2, X, Camera, Home, Shield, TrendingUp, Bell, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';
import { YangoProductCard } from '@/components/marketplace/YangoProductCard';
import { AiShopperProductCard } from '@/components/marketplace/AiShopperProductCard';
import { useProductPromotions } from '@/hooks/useProductPromotions';
import { VendorShopShareButtons } from '@/components/marketplace/VendorShopShareButtons';
import { VendorRatingDialog } from '@/components/marketplace/VendorRatingDialog';
import { ProductDetailSheet } from '@/components/marketplace/ProductDetailSheet';
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const { calculateDiscount, getOriginalPrice } = useProductPromotions();

  // Handler pour l'aperçu rapide
  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };
  
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
          is_active: newState,
          notification_preferences: newState ? {
            new_products: true,
            promotions: true,
            updates: true,
            enabled: true
          } : null
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
        title: newState ? '🔔 Abonné avec notifications !' : 'Désabonné',
        description: newState 
          ? `Vous serez notifié des nouveautés et promotions de ${profile.shop_name}.`
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
      
      {/* Header Boutique Épuré */}
      <header className="bg-background/95 border-b sticky top-0 z-20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Retour + Logo + Nom */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="relative shrink-0">
                {profile.shop_logo_url ? (
                  <img 
                    src={profile.shop_logo_url} 
                    alt={profile.shop_name}
                    className="w-11 h-11 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                )}
                {/* Badge vérifié petit */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 border border-background flex items-center justify-center">
                  <Shield className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              
              <div className="min-w-0">
                <h1 className="text-base font-bold truncate">{profile.shop_name}</h1>
                <p className="text-xs text-muted-foreground">
                  Bienvenue chez vous ! 👋
                </p>
              </div>
            </div>

            {/* Actions compactes */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareDialog(true)}
                className="h-9 w-9"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/marketplace')}
                className="h-9 w-9"
              >
                <Store className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner (si disponible) */}
      {profile.shop_banner_url && (
        <div className="w-full h-28 md:h-40 overflow-hidden">
          <img
            src={profile.shop_banner_url}
            alt={profile.shop_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Stats Inline Horizontales + Bouton S'abonner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-xl p-4 border shadow-sm">
          {/* Stats en ligne */}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="flex items-center gap-1.5 text-foreground">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{products.length}</span>
              <span className="text-muted-foreground">produits</span>
            </span>
            
            <span className="text-muted-foreground/50">•</span>
            
            <span className="flex items-center gap-1.5 text-foreground">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{profile.total_sales || 0}</span>
              <span className="text-muted-foreground">ventes</span>
            </span>
            
            <span className="text-muted-foreground/50">•</span>
            
            <button 
              onClick={() => setShowRatingDialog(true)}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="font-semibold">{profile.average_rating?.toFixed(1) || '0.0'}</span>
            </button>
            
            <span className="text-muted-foreground/50">•</span>
            
            <span className="flex items-center gap-1.5 text-foreground">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{profile.follower_count || 0}</span>
              <span className="text-muted-foreground hidden sm:inline">abonnés</span>
            </span>
          </div>

          {/* Bouton S'abonner avec notifications */}
          {!user ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/auth')}
              className="shrink-0 gap-1.5"
            >
              <Bell className="h-4 w-4" />
              S'abonner
            </Button>
          ) : (
            <Button
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
              className={`shrink-0 gap-1.5 ${isSubscribed ? 'border-green-500 text-green-600' : ''}`}
              onClick={handleSubscribe}
            >
              {isSubscribed ? (
                <>
                  <BellRing className="h-4 w-4" />
                  Abonné
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  S'abonner
                </>
              )}
            </Button>
          )}
        </div>

        {/* Grille Produits */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Produits disponibles ({products.length})
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
                    onQuickView={() => handleQuickView(product)}
                    onToggleFavorite={() => handleToggleFavorite(product.id)}
                    isFavorite={favorites.includes(product.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ProductDetailSheet - Aperçu rapide cohérent avec Kwenda Food */}
      {selectedProduct && (
        <ProductDetailSheet
          open={isProductDetailOpen}
          onOpenChange={(open) => {
            setIsProductDetailOpen(open);
            if (!open) setTimeout(() => setSelectedProduct(null), 300);
          }}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.title,
            price: selectedProduct.price,
            originalPrice: calculateDiscount({
              ...selectedProduct,
              seller_id: selectedProduct.seller.id,
              inStock: selectedProduct.stock_count > 0,
              stockCount: selectedProduct.stock_count,
              seller: selectedProduct.seller,
              image: selectedProduct.images[0] || '/placeholder.svg',
              images: selectedProduct.images,
              coordinates: undefined,
              rating: 0,
              reviews: 0,
              moderation_status: 'approved',
              popularityScore: 0,
              viewCount: 0,
              salesCount: 0,
              condition: 'new',
              location: ''
            }) > 0 
              ? getOriginalPrice(selectedProduct.price, calculateDiscount({
                  ...selectedProduct,
                  seller_id: selectedProduct.seller.id,
                  inStock: selectedProduct.stock_count > 0,
                  stockCount: selectedProduct.stock_count,
                  seller: selectedProduct.seller,
                  image: selectedProduct.images[0] || '/placeholder.svg',
                  images: selectedProduct.images,
                  coordinates: undefined,
                  rating: 0,
                  reviews: 0,
                  moderation_status: 'approved',
                  popularityScore: 0,
                  viewCount: 0,
                  salesCount: 0,
                  condition: 'new',
                  location: ''
                })) 
              : undefined,
            image: selectedProduct.images[0] || '/placeholder.svg',
            images: selectedProduct.images,
            description: selectedProduct.description,
            seller: selectedProduct.seller.display_name,
            sellerId: selectedProduct.seller.id,
            sellerLogoUrl: profile?.shop_logo_url || undefined,
            isAvailable: selectedProduct.stock_count > 0,
            stockCount: selectedProduct.stock_count,
            condition: 'new'
          }}
          onAddToCart={(quantity) => {
            for (let i = 0; i < quantity; i++) {
              handleAddToCart(selectedProduct);
            }
          }}
          onSellerClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

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
