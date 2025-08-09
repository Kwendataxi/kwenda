import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Package, Store, User, Plus, ArrowLeft, ShoppingBag, ShoppingCart as CartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Components
import { CategoryFilter } from './CategoryFilter';
import { SearchBar } from './SearchBar';
import { ModernProductCard } from './ModernProductCard';
import { ShoppingCart } from './ShoppingCart';
import { CreateOrderDialog } from './CreateOrderDialog';
import { SellProductForm } from './SellProductForm';
import { VendorDashboard } from './VendorDashboard';
import { DeliveryCalculator } from './DeliveryCalculator';
import { OrderTracker } from './OrderTracker';
import { AdvancedOrderTracker } from './AdvancedOrderTracker';

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useEnhancedGeolocation } from '@/hooks/useEnhancedGeolocation';

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
  onBack: () => void;
}

export const EnhancedMarketplaceInterface: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const { enhancedData } = useEnhancedGeolocation();
  const locationLoading = !enhancedData;
  const coordinates = enhancedData ? { lat: enhancedData.latitude, lng: enhancedData.longitude } : null;
  
  // State management
  const [currentTab, setCurrentTab] = useState<'shop' | 'sell' | 'orders' | 'vendor'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
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
        seller: { display_name: 'Vendeur' },
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
        title: 'Erreur',
        description: 'Impossible de charger les produits',
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
        seller: product.seller.display_name || 'Vendeur inconnu',
        seller_id: product.seller_id,
        coordinates: product.coordinates
      }]);
    }

    toast({
      title: 'Produit ajouté',
      description: `${product.title} a été ajouté au panier`,
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

  const handleCreateOrder = (product: Product) => {
    setSelectedProduct(product);
    setIsOrderDialogOpen(true);
  };

  const handleCheckout = async () => {
    if (!coordinates) {
      toast({
        title: 'Localisation requise',
        description: 'Activez la géolocalisation pour calculer la livraison',
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
        
        // Calculate delivery fee (base 2000 FC + 500 FC per km)
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
            `Commande via marketplace - Distance: ${distance.toFixed(1)}km - Frais de livraison: ${deliveryFee.toLocaleString()} FC`
          );
        }
      }
    }

    // Clear cart and close
    setCartItems([]);
    setIsCartOpen(false);
    
    toast({
      title: 'Commandes créées',
      description: 'Vos commandes ont été transmises aux vendeurs',
    });
  };

  const renderShopTab = () => (
    <div className="space-y-4">
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

      {coordinates && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Votre position: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
            <Badge variant="secondary" className="ml-auto">
              {filteredProducts.length} produits
            </Badge>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-9 bg-muted rounded"></div>
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
            <ModernProductCard
              key={product.id}
              product={{ 
                ...product, 
                name: product.title,
                seller: product.seller.display_name
              }}
              onAddToCart={() => addToCart(product)}
              onViewDetails={() => handleCreateOrder(product)}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Shopping</h1>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <Package className="w-5 h-5" />
            {cartItems.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="shop" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Boutique
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Vendre
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <CartIcon className="w-4 h-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Vendeur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-4">
            {renderShopTab()}
          </TabsContent>

          <TabsContent value="sell" className="mt-4">
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
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <AdvancedOrderTracker />
          </TabsContent>

          <TabsContent value="vendor" className="mt-4">
            <VendorDashboard onProductUpdate={loadProducts} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Shopping Cart */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />

      {/* Order Dialog */}
      {selectedProduct && (
        <CreateOrderDialog
          product={selectedProduct}
          isOpen={isOrderDialogOpen}
          onClose={() => {
            setIsOrderDialogOpen(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setIsOrderDialogOpen(false);
            setSelectedProduct(null);
            setCurrentTab('orders');
          }}
        />
      )}
    </div>
  );
};

async function handleProductSubmit(productData: any) {
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
      seller_id: (await supabase.auth.getUser()).data.user?.id,
      location: productData.location,
      coordinates: productData.coordinates,
      status: 'active'
    });

  if (error) throw error;
  console.log('Product created:', data);
}