import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Tag, Award, Box } from 'lucide-react';

interface ProductSpecificationsProps {
  brand?: string;
  condition?: string;
  stockCount?: number;
  specifications?: Record<string, string>;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
  brand,
  condition,
  stockCount,
  specifications
}) => {
  return (
    <div className="space-y-4">
      {/* Product Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        {brand && (
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Marque</p>
                <p className="text-sm font-medium">{brand}</p>
              </div>
            </div>
          </Card>
        )}
        
        {condition && (
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">État</p>
                <Badge variant={condition === 'new' ? 'default' : 'secondary'} className="text-xs">
                  {condition === 'new' ? 'Neuf' : condition === 'used' ? 'Occasion' : condition}
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Stock Information */}
      {stockCount !== undefined && (
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Disponibilité</p>
              <p className="text-sm font-medium">
                {stockCount > 0 ? (
                  <span className="text-green-600">En stock ({stockCount} unités)</span>
                ) : (
                  <span className="text-destructive">Épuisé</span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Technical Specifications */}
      {specifications && Object.keys(specifications).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Spécifications techniques</h4>
          </div>
          <Card className="p-3">
            <div className="space-y-2">
              {Object.entries(specifications).map(([key, value], index) => (
                <React.Fragment key={key}>
                  {index > 0 && <Separator />}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">{key}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
