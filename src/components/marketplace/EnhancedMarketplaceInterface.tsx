import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Package, Store, User, Plus, ArrowLeft, ShoppingBag, ShoppingCart as CartIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatProvider } from '@/components/chat/ChatProvider';

// Components
import { CategoryFilter } from './CategoryFilter';
import { SearchBar } from './SearchBar';
import { CompactProductCard } from './CompactProductCard';
import { ModernShoppingCart } from './ModernShoppingCart';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { VendorStoreView } from './VendorStoreView';
import { ClientEscrowDashboard } from '../escrow/ClientEscrowDashboard';
import { SellProductForm } from './SellProductForm';
import { VendorDashboard } from './VendorDashboard';
import { HorizontalProductScroll } from './HorizontalProductScroll';
import { WalletBalance } from './WalletBalance';
import { DeliveryCalculator } from './DeliveryCalculator';
import { OrderTracker } from './OrderTracker';
import { AdvancedOrderTracker } from './AdvancedOrderTracker';
import { VerifiedSellerGuard } from './VerifiedSellerGuard';
import { FloatingChatButton } from './FloatingChatButton';
import { DeliveryFeeApprovalDialog } from './DeliveryFeeApprovalDialog';
import { EditProductForm } from './EditProductForm';

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserVerification } from '@/hooks/useUserVerification';
import { useWallet } from '@/hooks/useWallet';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  image: string;
  category: string;
  condition: string;
  description: string;
  seller_id: string;
  seller: { display_name: string };
  location: string;
  coordinates?: { lat: number; lng: number };
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviews: number;
  brand?: string;
  specifications?: Record<string, any>;
}

interface HorizontalProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  location?: { lat: number; lng: number };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
  seller_id: string;
  coordinates?: { lat: number; lng: number };
}

interface EnhancedMarketplaceInterfaceProps {
  onNavigate: (path: string) => void;
}

export const EnhancedMarketplaceInterface: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  return (
    <ChatProvider>
      <EnhancedMarketplaceContent onNavigate={onNavigate} />
    </ChatProvider>
  );
};

const EnhancedMarketplaceContent: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const geolocation = useGeolocation();
  const locationLoading = geolocation.loading;
  const coordinates = geolocation.latitude && geolocation.longitude ? { lat: geolocation.latitude, lng: geolocation.longitude } : null;
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useMarketplaceOrders();
  const { verification } = useUserVerification();
  const { wallet } = useWallet();
  const { startConversation } = useMarketplaceChat();
  
  // State management
  const [currentTab, setCurrentTab] = useState<'shop' | 'sell' | 'orders' | 'escrow' | 'vendor'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  
  // Delivery fee approval
  const [pendingFeeOrder, setPendingFeeOrder] = useState<any | null>(null);
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    priceRange: [0, 1000000] as [number, number],
    inStockOnly: false,
    nearbyOnly: false,
    maxDistance: 10, // km
  });

  // Hooks
  const ordersHook = useMarketplaceOrders();

  // Check for pending fee approval orders
  useEffect(() => {
    if (orders && orders.length > 0) {
      const pendingApproval = orders.find(o => o.status === 'pending_buyer_approval' && !o.delivery_fee_approved_by_buyer);
      if (pendingApproval && pendingApproval.id !== pendingFeeOrder?.id) {
        setPendingFeeOrder(pendingApproval);
        setIsFeeDialogOpen(true);
      }
    }
  }, [orders]);

  // Load products with optimized caching
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // ✅ FILTRE : Uniquement les produits approuvés visibles sur la marketplace
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('status', 'active')
        .eq('moderation_status', 'approved')  // ✅ Produits approuvés uniquement
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Handle empty data gracefully
      if (!data || data.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const transformedProducts = data.map(product => {
        const specsObj = product.specifications && typeof product.specifications === 'object' 
          ? product.specifications as Record<string, any>
          : {};
        
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          images: Array.isArray(product.images) ? product.images.map(img => String(img)) : [],
          image: Array.isArray(product.images) && product.images.length > 0 
            ? String(product.images[0])
            : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
          category: product.category,
          condition: product.condition || 'new',
          description: product.description || '',
          seller_id: product.seller_id,
          seller: { 
            display_name: t('marketplace.unknown_seller') // Will fetch from seller_profiles later
          },
          location: product.location || 'Kinshasa',
          coordinates: product.coordinates && typeof product.coordinates === 'object' 
            ? product.coordinates as { lat: number; lng: number }
            : undefined,
          inStock: (product.stock_count || 0) > 0,
          stockCount: product.stock_count || 0,
          rating: product.rating_average || 0,
          reviews: product.rating_count || 0,
          brand: product.brand,
          specifications: specsObj,
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Set empty products on error instead of showing error toast
      setProducts([]);
      
      // Only show toast for network errors, not empty results
      if (error instanceof Error && error.message !== 'No rows found') {
        toast({
          title: t('common.error'),
          description: 'Impossible de charger les produits. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Price filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }

    // Stock filter
    if (filters.inStockOnly && !product.inStock) {
      return false;
    }

    // Distance filter
    if (filters.nearbyOnly && coordinates && product.coordinates) {
      const distance = calculateDistance(
        coordinates.lat, coordinates.lng,
        product.coordinates.lat, product.coordinates.lng
      );
      if (distance > filters.maxDistance) {
        return false;
      }
    }

    return true;
  });

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.title,
        price: product.price,
        image: product.image,
        quantity: 1,
        seller: product.seller.display_name || t('marketplace.unknown_seller'),
        seller_id: product.seller_id,
        coordinates: product.coordinates
      }]);
    }

    toast({
      title: t('marketplace.product_added'),
      description: t('marketplace.product_added_desc').replace('{0}', product.title),
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleProductSubmit = async (productData: any): Promise<boolean> => {
    console.log('📦 [Marketplace] Starting product submission');
    
    // ✅ Vérification authentification STRICTE
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      console.error('❌ [Marketplace] User not authenticated');
      toast({
        title: '❌ Non authentifié',
        description: 'Vous devez être connecté pour publier un produit',
        variant: 'destructive',
      });
      return false;
    }
    
    console.log('✅ [Marketplace] User authenticated:', user.id);
    console.log('📦 [Marketplace] Product data:', {
      title: productData.title,
      category: productData.category,
      price: productData.price,
      imagesCount: productData.images?.length || 0,
      sellerId: user.id
    });

    try {
      // ✅ Fonction helper pour retry upload
      const uploadWithRetry = async (file: File, fileName: string, retries = 1) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          const { data, error } = await supabase.storage
            .from('marketplace-products')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            });
          
          if (!error) return { data, error: null };
          
          if (attempt < retries && error.message.includes('fetch')) {
            console.warn(`⚠️ Retry ${attempt + 1}/${retries} for ${fileName}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          return { data: null, error };
        }
        return { data: null, error: new Error('Max retries reached') };
      };

      // 1. Upload images to Supabase Storage
      const imageUrls: string[] = [];
      
      if (productData.images && productData.images.length > 0) {
        console.log(`📤 [Marketplace] Uploading ${productData.images.length} images`);
        toast({
          title: '📤 Upload des images...',
          description: `Upload de ${productData.images.length} image(s) en cours...`,
        });

        for (let i = 0; i < productData.images.length; i++) {
          const file = productData.images[i];
          console.log(`📤 [Marketplace] Uploading image ${i + 1}/${productData.images.length}:`, {
            name: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type
          });
          
          // Generate unique filename avec préfixe products/
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/products/${Date.now()}-${i}.${fileExt}`;
          
          // ✅ Upload vers bucket marketplace-products avec retry
          const { data: uploadData, error: uploadError } = await uploadWithRetry(file, fileName);

          if (uploadError) {
            console.error('❌ [Marketplace] Image upload error:', {
              message: uploadError.message,
              fileName: fileName,
              userId: user.id
            });
            toast({
              title: '❌ Erreur upload image',
              description: `Impossible d'uploader l'image ${i + 1}: ${uploadError.message}`,
              variant: 'destructive',
            });
            return false;
          }

          // Get public URL depuis marketplace-products
          const { data: { publicUrl } } = supabase.storage
            .from('marketplace-products')
            .getPublicUrl(fileName);
          
          console.log(`✅ [Marketplace] Image ${i + 1} uploaded:`, publicUrl);
          imageUrls.push(publicUrl);
        }
        console.log(`✅ [Marketplace] All ${imageUrls.length} images uploaded successfully`);
      }

      // 2. Create product in Supabase with uploaded image URLs
      console.log('💾 [Marketplace] Creating product in database');
      const productPayload = {
        title: productData.title,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        condition: productData.condition || 'new',
        images: imageUrls,
        seller_id: user.id,
        location: productData.location,
        coordinates: productData.coordinates,
        stock_count: productData.stock_count || 1,
        brand: productData.brand || null,
        specifications: productData.specifications || {},
        status: 'active',
        moderation_status: 'pending'
      };
      console.log('💾 [Marketplace] Product payload:', productPayload);

      const { data, error } = await supabase
        .from('marketplace_products')
        .insert(productPayload)
        .select()
        .single();

      if (error) {
        console.error('❌ [Marketplace] Error creating product:', error);
        toast({
          title: '❌ Erreur de création',
          description: error.message || 'Impossible de créer le produit. Veuillez réessayer.',
          variant: 'destructive',
        });
        return false;
      }

      console.log('✅ [Marketplace] Product created successfully:', {
        id: data.id,
        title: data.title,
        status: data.moderation_status
      });

      // ✅ Appeler la edge function pour notifier les admins
      console.log('📧 [Marketplace] Notifying admins about new product');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🔐 [Marketplace] Session found, calling notify-admin-new-product');
          const notificationPayload = {
            productId: data.id,
            sellerId: user?.id,
            productTitle: data.title,
            productCategory: data.category,
            productPrice: data.price
          };
          console.log('📧 [Marketplace] Notification payload:', notificationPayload);

          const { data: notifData, error: notifError } = await supabase.functions.invoke('notify-admin-new-product', {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            },
            body: notificationPayload
          });

          if (notifError) {
            console.error('❌ [Marketplace] Admin notification error:', notifError);
          } else {
            console.log('✅ [Marketplace] Admin notification sent successfully:', notifData);
          }
        } else {
          console.warn('⚠️ [Marketplace] No session available for admin notification');
        }
      } catch (notifError) {
        console.error('❌ [Marketplace] Error in admin notification process:', notifError);
      }

      // Reload products
      console.log('🔄 [Marketplace] Reloading products list');
      await loadProducts();
      
      console.log('✅ [Marketplace] Product submission completed successfully');
      return true;
      
    } catch (error: any) {
      console.error('❌ [Marketplace] Product submission failed:', error);
      console.error('❌ [Marketplace] Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      toast({
        title: '❌ Erreur de création',
        description: error.message || 'Impossible de créer le produit. Veuillez réessayer.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleCheckout = async () => {
    if (!coordinates) {
      toast({
        title: t('marketplace.location_required'),
        description: t('marketplace.location_required_desc'),
        variant: 'destructive',
      });
      return;
    }

    // Calculate delivery for each vendor
    const vendorGroups = cartItems.reduce((groups, item) => {
      const vendorId = item.seller_id;
      if (!groups[vendorId]) {
        groups[vendorId] = [];
      }
      groups[vendorId].push(item);
      return groups;
    }, {} as Record<string, CartItem[]>);

    // Process orders for each vendor
    for (const [vendorId, items] of Object.entries(vendorGroups)) {
      const vendorLocation = items[0].coordinates;
      if (vendorLocation) {
        const distance = calculateDistance(
          coordinates.lat, coordinates.lng,
          vendorLocation.lat, vendorLocation.lng
        );
        
        // Calculate delivery fee (base 2000 CDF + 500 CDF per km)
        const deliveryFee = 2000 + (distance * 500);
        
        // Create order for this vendor
        for (const item of items) {
          await ordersHook.createOrder(
            item.id,
            vendorId,
            item.quantity,
            item.price,
            `${coordinates.lat}, ${coordinates.lng}`,
            coordinates,
            'delivery',
            `Commande via marketplace - Distance: ${distance.toFixed(1)}km - Frais de livraison: ${deliveryFee.toLocaleString()} CDF`
          );
        }
      }
    }

    // Clear cart and close
    setCartItems([]);
    setIsCartOpen(false);
    
    toast({
      title: t('marketplace.orders_created'),
      description: t('marketplace.orders_created_desc'),
    });
  };

  // Product filtering and grouping
  const featuredProducts = filteredProducts.slice(0, 8);
  const popularProducts = filteredProducts.filter(p => p.rating >= 4.5).slice(0, 6);
  const nearbyProducts = filteredProducts.filter(p => p.coordinates).slice(0, 6);

  const renderShopTab = () => (
    <div className="space-y-4">
      {/* Wallet Balance */}
      {wallet && (
        <WalletBalance 
          balance={wallet.balance}
          currency={wallet.currency}
          compact
        />
      )}

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={() => {}}
        filters={{ ...filters, freeShipping: false }}
        onFiltersChange={setFilters}
      />
      
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        productCounts={{}}
      />

      {/* Horizontal Product Sections */}
      {featuredProducts.length > 0 && (
        <HorizontalProductScroll
          title={`✨ ${t('marketplace.featured')}`}
          products={featuredProducts.map(p => ({ 
            id: p.id,
            name: p.title, 
            price: p.price,
            image: p.image,
            rating: p.rating,
            reviewCount: p.reviews,
            category: p.category,
            seller: p.seller.display_name,
            sellerId: p.seller_id,
            isAvailable: p.inStock,
            location: p.coordinates
          })) as HorizontalProduct[]}
          onAddToCart={(product) => {
            const originalProduct = featuredProducts.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = featuredProducts.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
            }
          }}
          onViewSeller={(sellerId) => setSelectedVendorId(sellerId)}
          userLocation={coordinates}
          loading={loading}
        />
      )}

      {popularProducts.length > 0 && (
        <HorizontalProductScroll
          title={`⭐ ${t('marketplace.popular')}`}
          products={popularProducts.map(p => ({ 
            id: p.id,
            name: p.title, 
            price: p.price,
            image: p.image,
            rating: p.rating,
            reviewCount: p.reviews,
            category: p.category,
            seller: p.seller.display_name,
            sellerId: p.seller_id,
            isAvailable: p.inStock,
            location: p.coordinates
          })) as HorizontalProduct[]}
          onAddToCart={(product) => {
            const originalProduct = popularProducts.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = popularProducts.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
            }
          }}
          onViewSeller={(sellerId) => setSelectedVendorId(sellerId)}
          userLocation={coordinates}
          loading={loading}
        />
      )}

      {nearbyProducts.length > 0 && coordinates && (
        <HorizontalProductScroll
          title={`📍 ${t('marketplace.nearby')}`}
          products={nearbyProducts.map(p => ({ 
            id: p.id,
            name: p.title, 
            price: p.price,
            image: p.image,
            rating: p.rating,
            reviewCount: p.reviews,
            category: p.category,
            seller: p.seller.display_name,
            sellerId: p.seller_id,
            isAvailable: p.inStock,
            location: p.coordinates
          })) as HorizontalProduct[]}
          onAddToCart={(product) => {
            const originalProduct = nearbyProducts.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = nearbyProducts.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
            }
          }}
          onViewSeller={(sellerId) => setSelectedVendorId(sellerId)}
          userLocation={coordinates}
          loading={loading}
        />
      )}


      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 12 }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse card-modern">
              <div className="aspect-square bg-muted/60"></div>
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted/60 rounded"></div>
                <div className="h-2 bg-muted/60 rounded w-3/4"></div>
                <div className="h-3 bg-muted/60 rounded w-1/2"></div>
              </div>
            </Card>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gradient-congo-subtle rounded-full flex items-center justify-center mb-6 shadow-md">
              <Package className="w-10 h-10 text-congo-red" />
            </div>
            <h3 className="font-semibold text-responsive-lg mb-3">Aucun produit trouvé</h3>
            <p className="text-muted-foreground text-responsive-sm max-w-sm">
              Essayez de modifier vos critères de recherche ou explorez d'autres catégories
            </p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <CompactProductCard
              key={product.id}
              product={{ 
                id: product.id,
                name: product.title,
                price: product.price,
                image: product.image,
                rating: product.rating,
                reviewCount: product.reviews,
                category: product.category,
                seller: product.seller.display_name,
                sellerId: product.seller_id,
                isAvailable: product.inStock,
                location: product.coordinates
              }}
              onAddToCart={() => addToCart(product)}
              onViewDetails={() => {
                setSelectedProduct(product);
                setIsProductDetailsOpen(true);
              }}
              onViewSeller={(sellerId) => setSelectedVendorId(sellerId)}
              userLocation={coordinates}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background mobile-safe-layout">
      {/* Modern Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('/client')} className="touch-manipulation">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Kwenda Shop
            </h1>
            <p className="text-xs text-muted-foreground">Marketplace sécurisé</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative touch-manipulation"
            onClick={() => setIsCartOpen(true)}
          >
            <Package className="w-5 h-5" />
            {cartItems.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-primary animate-pulse">
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 content-scrollable">
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="shop" className="flex items-center gap-1 touch-manipulation">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Boutique</span>
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-1 touch-manipulation">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Vendre</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 touch-manipulation">
              <CartIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="escrow" className="flex items-center gap-1 touch-manipulation">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Escrow</span>
            </TabsTrigger>
            <TabsTrigger value="vendor" className="flex items-center gap-1 touch-manipulation">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Vendeur</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-4">
            {renderShopTab()}
          </TabsContent>

          <TabsContent value="sell" className="mt-4">
            <VerifiedSellerGuard>
              <div className="space-y-6">
                <SellProductForm
                  onBack={() => setCurrentTab('shop')}
                  onSubmit={async (formData) => {
                    // Handle product creation with auto-location
                    const success = await handleProductSubmit({
                      ...formData,
                      coordinates: coordinates,
                      location: 'Kinshasa'
                    });
                    
                    if (success) {
                      setCurrentTab('vendor');
                      toast({
                        title: '✅ Produit soumis avec succès!',
                        description: 'Redirection vers votre tableau de bord vendeur...',
                        duration: 5000,
                      });
                    }
                  }}
                />
              </div>
            </VerifiedSellerGuard>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <AdvancedOrderTracker />
          </TabsContent>

          <TabsContent value="escrow" className="mt-4">
            <ClientEscrowDashboard />
          </TabsContent>

          <TabsContent value="vendor" className="mt-4">
            {editingProduct ? (
              <EditProductForm
                product={editingProduct}
                onBack={() => setEditingProduct(null)}
                onUpdate={() => {
                  setEditingProduct(null);
                  loadProducts();
                }}
              />
            ) : (
              <VendorDashboard 
                onProductUpdate={loadProducts}
                onEditProduct={(product) => setEditingProduct(product)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modern Shopping Cart with Escrow */}
      <ModernShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        userCoordinates={coordinates}
      />

      {/* Product Details Dialog */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={{
            id: selectedProduct.id,
            name: selectedProduct.title,
            price: selectedProduct.price,
            image: selectedProduct.image,
            rating: selectedProduct.rating,
            reviewCount: selectedProduct.reviews,
            category: selectedProduct.category,
            seller: selectedProduct.seller.display_name,
            sellerId: selectedProduct.seller_id,
            isAvailable: selectedProduct.inStock,
            description: selectedProduct.description,
            location: selectedProduct.coordinates,
            brand: 'HP', // TODO: Add to product data
            condition: selectedProduct.condition,
            stockCount: selectedProduct.stockCount,
            specifications: {
              'Processeur': 'Intel Core i5',
              'RAM': '8GB DDR4',
              'Stockage': '256GB SSD',
              'Écran': '15.6" Full HD'
            } // TODO: Add to product data
          }}
          isOpen={isProductDetailsOpen}
          onClose={() => {
            setIsProductDetailsOpen(false);
            setSelectedProduct(null);
          }}
          onAddToCart={(product) => {
            if (selectedProduct) addToCart(selectedProduct);
          }}
          onViewSeller={(sellerId) => setSelectedVendorId(sellerId)}
          similarProducts={
            products
              .filter(p => 
                p.category === selectedProduct.category && 
                p.id !== selectedProduct.id &&
                p.seller_id !== selectedProduct.seller_id
              )
              .slice(0, 10)
              .map(p => ({
                id: p.id,
                name: p.title,
                price: p.price,
                image: p.image,
                rating: p.rating,
                reviewCount: p.reviews,
                category: p.category,
                seller: p.seller.display_name,
                sellerId: p.seller_id,
                isAvailable: p.inStock,
                location: p.coordinates
              }))
          }
          sellerProducts={
            products
              .filter(p => 
                p.seller_id === selectedProduct.seller_id && 
                p.id !== selectedProduct.id
              )
              .slice(0, 10)
              .map(p => ({
                id: p.id,
                name: p.title,
                price: p.price,
                image: p.image,
                rating: p.rating,
                reviewCount: p.reviews,
                category: p.category,
                seller: p.seller.display_name,
                sellerId: p.seller_id,
                isAvailable: p.inStock,
                location: p.coordinates
              }))
          }
          userLocation={coordinates}
        />
      )}

      {/* Vendor Store View */}
      {selectedVendorId && (
        <VendorStoreView
          vendorId={selectedVendorId}
          onClose={() => setSelectedVendorId(null)}
          onAddToCart={(product) => {
            // Find the original product and add to cart
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
              setSelectedVendorId(null);
            }
          }}
          userLocation={coordinates}
        />
      )}

      {/* Delivery Fee Approval Dialog */}
      {pendingFeeOrder && (
        <DeliveryFeeApprovalDialog
          order={pendingFeeOrder}
          open={isFeeDialogOpen}
          onOpenChange={setIsFeeDialogOpen}
          onApproved={() => {
            setIsFeeDialogOpen(false);
            setPendingFeeOrder(null);
            refetchOrders();
            toast({ title: "✅ Paiement confirmé", description: "Votre commande sera bientôt livrée" });
          }}
          onOpenChat={async () => {
            const conversationId = await startConversation(pendingFeeOrder.product_id, pendingFeeOrder.seller_id);
            if (conversationId) {
              setIsFeeDialogOpen(false);
              toast({ title: "Chat ouvert", description: "Discutez avec le vendeur" });
            }
          }}
        />
      )}

      {/* Floating Chat Button - Marketplace */}
      <FloatingChatButton />
    </div>
  );
};

export default EnhancedMarketplaceInterface;
