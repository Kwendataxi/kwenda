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

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserVerification } from '@/hooks/useUserVerification';
import { useWallet } from '@/hooks/useWallet';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const geolocation = useGeolocation();
  const locationLoading = geolocation.loading;
  const coordinates = geolocation.latitude && geolocation.longitude ? { lat: geolocation.latitude, lng: geolocation.longitude } : null;
  const { orders, loading: ordersLoading } = useMarketplaceOrders();
  const { verification } = useUserVerification();
  const { wallet } = useWallet();
  
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

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProducts = data?.map(product => ({
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
        seller: { display_name: t('marketplace.unknown_seller') },
        location: product.location || 'Kinshasa',
        coordinates: product.coordinates && typeof product.coordinates === 'object' 
          ? product.coordinates as { lat: number; lng: number }
          : undefined,
        inStock: true,
        stockCount: Math.floor(Math.random() * 20) + 1,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 200) + 10,
      })) || [];

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: t('common.error'),
        description: t('marketplace.error_load'),
        variant: 'destructive',
      });
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

  const handleProductSubmit = async (productData: any) => {
    // Create product in Supabase
    const { data, error } = await supabase
      .from('marketplace_products')
      .insert({
        title: productData.title,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        condition: productData.condition || 'new',
        images: productData.images || [],
        seller_id: user?.id,
        location: productData.location,
        coordinates: productData.coordinates,
        status: 'active'
      });

    if (error) throw error;
    console.log('Product created:', data);
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


      <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 15 }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse max-w-[160px]">
              <div className="aspect-square bg-muted"></div>
              <div className="p-2 space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-2 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground max-w-sm">
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
              <SellProductForm
                onBack={() => setCurrentTab('shop')}
                  onSubmit={async (formData) => {
                  // Handle product creation with auto-location
                  try {
                    await handleProductSubmit({
                      ...formData,
                      coordinates: coordinates,
                      location: 'Kinshasa'
                    });
                    setCurrentTab('shop');
                    loadProducts();
                  } catch (error) {
                    console.error('Error submitting product:', error);
                  }
                }}
              />
            </VerifiedSellerGuard>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <AdvancedOrderTracker />
          </TabsContent>

          <TabsContent value="escrow" className="mt-4">
            <ClientEscrowDashboard />
          </TabsContent>

          <TabsContent value="vendor" className="mt-4">
            <VendorDashboard onProductUpdate={loadProducts} />
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
            location: selectedProduct.coordinates
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
    </div>
  );
};

export default EnhancedMarketplaceInterface;
