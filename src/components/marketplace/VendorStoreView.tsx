import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar,
  Search,
  Grid3X3,
  List,
  Package,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
import { useVendorFollowers } from '@/hooks/useVendorFollowers';
import { CompactProductCard } from './CompactProductCard';
import { ProductGrid } from './ProductGrid';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  location?: { lat: number; lng: number };
}

interface VendorStoreViewProps {
  vendorId: string;
  onClose?: () => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export const VendorStoreView: React.FC<VendorStoreViewProps> = ({
  vendorId,
  onClose,
  onAddToCart,
  onViewDetails,
  userLocation
}) => {
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const { followerCount } = useVendorFollowers(vendorId);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadVendorData();
  }, [vendorId]);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      
      // Load vendor profile with real stats
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      // Load vendor's bio from profiles (keep profiles for bio only)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('bio')
        .eq('id', vendorId)
        .single();

      // Use shop_name and shop_logo_url from vendor_profiles
      setVendor({
        ...vendorData,
        bio: profileData?.bio,
        display_name: vendorData?.shop_name || 'Boutique',
        avatar_url: vendorData?.shop_logo_url || null
      });

      // Check subscription status
      if (user) {
        const { data: subData } = await supabase
          .from('vendor_followers')
          .select('is_active')
          .eq('vendor_id', vendorId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsSubscribed(subData?.is_active || false);
      }

      // Load vendor products (only approved)
      const { data: productsData, error: productsError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', vendorId)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedProducts = productsData?.map(product => ({
        id: product.id,
        name: product.title,
        price: product.price,
        image: Array.isArray(product.images) && product.images.length > 0 
          ? String(product.images[0])
          : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 50) + 5,
        category: product.category,
        seller: vendorData?.shop_name || 'Vendeur',
        sellerId: product.seller_id,
        isAvailable: product.status === 'active',
        location: product.coordinates && typeof product.coordinates === 'object' 
          ? product.coordinates as { lat: number; lng: number }
          : undefined,
      })) || [];

      setProducts(transformedProducts);
      setActiveProductsCount(transformedProducts.length);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: '🔒 Connectez-vous',
        description: 'Créez un compte pour vous abonner à cette boutique.',
      });
      return;
    }

    try {
      const newState = !isSubscribed;
      
      await supabase
        .from('vendor_followers')
        .upsert({
          vendor_id: vendorId,
          user_id: user.id,
          is_active: newState
        });
      
      setIsSubscribed(newState);
      
      toast({
        title: newState ? '🎉 Abonné !' : 'Désabonné',
        description: newState 
          ? 'Vous recevrez des notifications des nouveautés de cette boutique.'
          : 'Vous ne recevrez plus de notifications.',
      });
      
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-2" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-2" />
              <div className="h-3 bg-muted rounded mb-1" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Hero Header with Cover */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        {vendor?.shop_banner_url && (
          <img src={vendor.shop_banner_url} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Button variant="ghost" size="icon" onClick={onClose} className="bg-background/80 backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant={isSubscribed ? "secondary" : "default"}
            size="sm"
            onClick={handleSubscribe}
            className="gap-2 font-semibold"
          >
            <Users className="h-4 w-4" />
            {isSubscribed ? 'Abonné' : 'S\'abonner'}
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-end gap-4">
            {/* Avatar with verified badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white">
                {vendor?.shop_logo_url ? (
                  <img 
                    src={vendor.shop_logo_url} 
                    className="w-full h-full object-cover" 
                    alt="Logo boutique"
                  />
                ) : vendor?.avatar_url ? (
                  <img 
                    src={vendor.avatar_url} 
                    className="w-full h-full object-cover" 
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                    {vendor?.shop_name?.[0] || vendor?.display_name?.[0] || 'V'}
                  </div>
                )}
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1"
                whileHover={{ scale: 1.2 }}
              >
                <Shield className="h-4 w-4 text-white" />
              </motion.div>
            </motion.div>

            <div className="flex-1 text-white">
              <h1 className="text-2xl font-bold">{vendor?.shop_name || vendor?.display_name || 'Boutique'}</h1>
              <p className="text-sm opacity-90">{vendor?.shop_description || vendor?.bio || 'Vendeur certifié Kwenda'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 p-4 border-b">
        {[
          { label: "Produits", value: activeProductsCount, icon: Package, color: "text-blue-500" },
          { label: "Ventes", value: (vendor?.total_sales || 0).toLocaleString(), icon: TrendingUp, color: "text-green-500" },
          { label: "Note", value: vendor?.average_rating?.toFixed(1) || '0.0', icon: Star, color: "text-yellow-500" },
          { label: "Abonnés", value: followerCount, icon: Users, color: "text-purple-500" }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: i * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="p-3 text-center hover:shadow-lg transition-shadow">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Header with view controls */}
      <div className="flex items-center gap-4 p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans cette boutique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>


      {/* Products Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Aucun produit trouvé</h3>
              <p className="text-sm text-muted-foreground">
                Essayez un autre terme de recherche
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <ProductGrid
              products={filteredProducts}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              userLocation={userLocation}
            />
          ) : (
            <div className="grid gap-3 grid-cols-1">
              {filteredProducts.map((product) => (
                <CompactProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => onAddToCart(product)}
                  onViewDetails={() => onViewDetails(product)}
                  userLocation={userLocation}
                  className="flex-row"
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};