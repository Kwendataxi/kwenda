import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  images?: string[];
}

interface MyProductsListProps {
  loadMyProducts: () => Promise<Product[]>;
}

export const MyProductsList = ({ loadMyProducts }: MyProductsListProps) => {
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const products = await loadMyProducts();
      setMyProducts(products);
      setLoading(false);
    };
    fetchProducts();
  }, [loadMyProducts]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mes Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (myProducts.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mes Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Vous n'avez pas encore de produits.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Mes Produits ({myProducts.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {myProducts.some(p => p.moderation_status === 'pending') && (
          <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Validation en cours</p>
              <p className="text-sm text-muted-foreground">
                Vos produits sont en cours de validation et seront visibles après approbation par un administrateur.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-lg font-bold text-primary mb-2">
                  {product.price} {product.currency}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      product.moderation_status === 'approved'
                        ? 'default'
                        : product.moderation_status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {product.moderation_status === 'approved' && '✓ Approuvé'}
                    {product.moderation_status === 'pending' && '⏳ En attente'}
                    {product.moderation_status === 'rejected' && '✗ Rejeté'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                {product.moderation_status === 'rejected' && product.rejection_reason && (
                  <p className="text-xs text-destructive mt-2">
                    Raison: {product.rejection_reason}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
