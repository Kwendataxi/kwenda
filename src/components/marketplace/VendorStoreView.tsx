import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar,
  Search,
  Grid3X3,
  List
} from 'lucide-react';
import { CompactProductCard } from './CompactProductCard';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  discount?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

interface Vendor {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  joinDate: string;
  location?: string;
  description?: string;
  productsCount: number;
}

interface VendorStoreViewProps {
  vendorId: string;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onViewProductDetails: (product: Product) => void;
  userLocation?: { lat: number; lng: number };
}

export const VendorStoreView: React.FC<VendorStoreViewProps> = ({
  vendorId,
  onBack,
  onAddToCart,
  onViewProductDetails,
  userLocation
}) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadVendorData();
  }, [vendorId]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      // Load vendor profile (mock data for now)
      const mockVendor: Vendor = {
        id: vendorId,
        name: 'Boutique Moderne',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=' + vendorId,
        rating: 4.5,
        reviewCount: 127,
        joinDate: '2023-01-15',
        location: 'Kinshasa, RDC',
        description: 'Boutique spécialisée en électronique et accessoires de qualité.',
        productsCount: 0
      };

      // Load vendor products
      const { data: productsData, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', vendorId)
        .limit(50);

      if (error) throw error;

      const transformedProducts: Product[] = (productsData || []).map(item => ({
        id: item.id,
        name: item.title,
        price: item.price,
        originalPrice: (item as any).original_price,
        image: (item.images as string[])?.[0] || '/placeholder.svg',
        rating: (item as any).rating || 4.0,
        reviewCount: (item as any).review_count || 0,
        category: item.category,
        seller: (item as any).seller_name || 'Vendeur',
        sellerId: item.seller_id,
        isAvailable: (item as any).stock_quantity > 0,
        discount: (item as any).discount_percentage,
        location: item.coordinates && typeof item.coordinates === 'object' && 'lat' in item.coordinates ? {
          lat: (item.coordinates as any).lat,
          lng: (item.coordinates as any).lng
        } : undefined
      }));

      setVendor({ ...mockVendor, productsCount: transformedProducts.length });
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Vendeur non trouvé</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Boutique</h1>
      </div>

      <ScrollArea className="flex-1">
        {/* Vendor Profile */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <img
                src={vendor.avatar}
                alt={vendor.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold truncate">{vendor.name}</h2>
              
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{vendor.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({vendor.reviewCount} avis)
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                {vendor.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{vendor.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Depuis {formatDate(vendor.joinDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {vendor.description && (
            <p className="text-sm text-muted-foreground">{vendor.description}</p>
          )}

          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-primary">{vendor.productsCount}</div>
              <div className="text-muted-foreground">Produits</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-primary">{vendor.reviewCount}</div>
              <div className="text-muted-foreground">Avis</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Products Section */}
        <div className="p-4 space-y-4">
          {/* Search and View Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans cette boutique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                : "space-y-3"
            )}>
              {filteredProducts.map((product) => (
                <CompactProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewProductDetails}
                  userLocation={userLocation}
                  className={viewMode === 'list' ? "flex-row max-w-none" : ""}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};