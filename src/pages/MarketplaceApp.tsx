import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// Import marketplace components
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { CategoryFilter } from '@/components/marketplace/CategoryFilter';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { ResponsiveGrid } from '@/components/marketplace/ResponsiveGrid';
import { SellProductForm } from '@/components/marketplace/SellProductForm';
import { ChatInterface } from '@/components/marketplace/ChatInterface';
import { ShoppingCart } from '@/components/marketplace/ShoppingCart';
import { CreateOrderDialog } from '@/components/marketplace/CreateOrderDialog';
import { OrderManagement } from '@/components/marketplace/OrderManagement';
import { AdminDashboard } from '@/components/marketplace/AdminDashboard';
import { MarketplaceProductDetails } from '@/components/marketplace/MarketplaceProductDetails';

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { useWallet } from '@/hooks/useWallet';

interface MarketplaceProduct {
  id: string;
  name: string;
  title: string;
  price: number;
  images: string[];
  image: string;
  category: string;
  condition: string;
  description: string;
  seller_id: string;
  seller?: { display_name: string };
  status: 'active' | 'sold' | 'inactive';
  created_at: string;
  featured?: boolean;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  stockCount?: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
}

const MarketplaceApp: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // State management
  const [currentView, setCurrentView] = useState<'browse' | 'sell' | 'chat' | 'orders' | 'admin' | 'details'>('browse');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<MarketplaceProduct | null>(null);
  
  // Search and filter states
  const [filters, setFilters] = useState({
    priceRange: [0, 1000000] as [number, number],
    inStockOnly: false,
    freeShipping: false,
  });

  // Hooks
  const ordersHook = useMarketplaceOrders();
  const chatHook = useMarketplaceChat();
  const walletHook = useWallet();

  // Load products from Supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProducts = data?.map(product => ({
        id: product.id,
        name: product.title,
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
        seller: { display_name: 'Vendeur Kwenda' },
        status: product.status as 'active' | 'sold' | 'inactive',
        created_at: product.created_at,
        featured: product.featured || false,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 200) + 10,
        inStock: true,
        stockCount: Math.floor(Math.random() * 20) + 1,
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

  // Handle product creation
  const handleProductSubmit = async (formData: any) => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour vendre un produit',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      
      for (const file of formData.images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        imageUrls.push(urlData.publicUrl);
      }

      // Create product in database
      const { error } = await supabase
        .from('marketplace_products')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          condition: formData.condition,
          images: imageUrls,
          seller_id: user.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Produit publié',
        description: 'Votre produit a été mis en vente avec succès',
      });

      setCurrentView('browse');
      loadProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
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

    return true;
  });

  // Cart functions
  const addToCart = (product: MarketplaceProduct) => {
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
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        seller: product.seller?.display_name || 'Vendeur inconnu'
      }]);
    }

    toast({
      title: 'Produit ajouté',
      description: `${product.name} a été ajouté au panier`,
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

  const handleCheckout = () => {
    // For now, just clear the cart and show success
    setCartItems([]);
    setIsCartOpen(false);
    toast({
      title: 'Commande créée',
      description: 'Votre commande a été créée avec succès',
    });
  };

  // Render different views
  const renderCurrentView = () => {
    switch (currentView) {
      case 'sell':
        return (
          <SellProductForm
            onBack={() => setCurrentView('browse')}
            onSubmit={handleProductSubmit}
          />
        );
      
      case 'chat':
        return (
          <ChatInterface
            onBack={() => setCurrentView('browse')}
            onStartOrder={(productId, sellerId) => {
              const product = products.find(p => p.id === productId);
              if (product) {
                setOrderProduct(product);
                setIsOrderDialogOpen(true);
              }
            }}
          />
        );
      
      case 'orders':
        return (
          <OrderManagement />
        );
      
      case 'admin':
        return (
          <AdminDashboard onBack={() => setCurrentView('browse')} />
        );
      
      case 'details':
        return selectedProduct ? (
          <MarketplaceProductDetails
            product={{
              id: selectedProduct.id,
              name: selectedProduct.name,
              price: selectedProduct.price,
              image: selectedProduct.image,
              rating: selectedProduct.rating || 4.5,
              reviews: selectedProduct.reviews || 0,
              seller: selectedProduct.seller?.display_name || 'Vendeur inconnu',
              category: selectedProduct.category,
              description: selectedProduct.description,
              specifications: {},
              inStock: selectedProduct.inStock || true,
              stockCount: selectedProduct.stockCount || 1
            }}
            onBack={() => setCurrentView('browse')}
            onAddToCart={() => addToCart(selectedProduct)}
            onStartChat={() => setCurrentView('chat')}
            onCreateOrder={() => {
              setOrderProduct(selectedProduct);
              setIsOrderDialogOpen(true);
            }}
          />
        ) : null;
      
      default:
        return (
          <div className="space-y-4">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={() => {}}
              filters={filters}
              onFiltersChange={setFilters}
            />
            
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              productCounts={{}}
            />
            
            <ResponsiveGrid
              products={filteredProducts.map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                rating: product.rating || 4.5,
                reviews: product.reviews || 0,
                seller: product.seller?.display_name || 'Vendeur inconnu',
                category: product.category,
                description: product.description,
                specifications: {},
                inStock: product.inStock || true,
                stockCount: product.stockCount || 1
              }))}
              loading={loading}
              onAddToCart={(product) => {
                const originalProduct = filteredProducts.find(p => p.id === product.id);
                if (originalProduct) addToCart(originalProduct);
              }}
              onViewDetails={(product) => {
                const originalProduct = filteredProducts.find(p => p.id === product.id);
                if (originalProduct) {
                  setSelectedProduct(originalProduct);
                  setCurrentView('details');
                }
              }}
            />
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connexion requise</h2>
          <p className="text-muted-foreground">
            Vous devez être connecté pour accéder à la marketplace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        user={user}
        cartItemsCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
        onSellClick={() => setCurrentView('sell')}
        onChatClick={() => setCurrentView('chat')}
        onOrdersClick={() => setCurrentView('orders')}
        onAdminClick={() => setCurrentView('admin')}
        currentView={currentView}
      />

      <main className="pb-20">
        {renderCurrentView()}
      </main>

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
      {orderProduct && (
        <CreateOrderDialog
          product={orderProduct}
          isOpen={isOrderDialogOpen}
          onClose={() => {
            setIsOrderDialogOpen(false);
            setOrderProduct(null);
          }}
          onSuccess={() => {
            setIsOrderDialogOpen(false);
            setOrderProduct(null);
            setCurrentView('orders');
          }}
        />
      )}
    </div>
  );
};

export default MarketplaceApp;