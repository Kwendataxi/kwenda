import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Package } from 'lucide-react';

interface POSProductGridProps {
  restaurantId: string;
  onAddToCart: (product: any) => void;
}

export const POSProductGrid = ({ restaurantId, onAddToCart }: POSProductGridProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadProducts();
  }, [restaurantId]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('food_products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .eq('moderation_status', 'approved')
      .order('category', { ascending: true });

    if (!error && data) {
      setProducts(data);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap px-4 py-2"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Tous' : cat}
          </Badge>
        ))}
      </div>

      {/* Product Grid - Responsive optimisé */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {filteredProducts.map(product => (
          <Card
            key={product.id}
            className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            onClick={() => onAddToCart(product)}
          >
            <CardContent className="p-3">
              {product.main_image_url ? (
                <img
                  src={product.main_image_url}
                  alt={product.name}
                  className="w-full h-24 sm:h-28 md:h-32 object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="w-full h-24 sm:h-28 md:h-32 bg-muted rounded-lg mb-2 flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <h3 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-primary">
                  {product.price.toLocaleString()} FC
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
};
