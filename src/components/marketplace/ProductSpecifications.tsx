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
    <div className="space-y-3">
      {/* Product Info Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {brand && (
          <Card className="p-2.5 transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex items-center gap-2">
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Marque</p>
                <p className="text-xs sm:text-sm font-medium truncate">{brand}</p>
              </div>
            </div>
          </Card>
        )}
        
        {condition && (
          <Card className="p-2.5 transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground">État</p>
                <Badge variant={condition === 'new' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5">
                  {condition === 'new' ? 'Neuf' : condition === 'used' ? 'Occasion' : condition}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Stock Information */}
        {stockCount !== undefined && (
          <Card className="p-2.5 transition-all hover:shadow-md hover:border-primary/30 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Disponibilité</p>
                <p className="text-xs sm:text-sm font-medium truncate">
                  {stockCount > 0 ? (
                    <span className="text-green-600">En stock ({stockCount})</span>
                  ) : (
                    <span className="text-destructive">Épuisé</span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Technical Specifications */}
      {specifications && Object.keys(specifications).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" />
            <h4 className="text-xs sm:text-sm font-semibold">Spécifications techniques</h4>
          </div>
          <Card className="p-2.5 sm:p-3">
            <div className="space-y-1.5">
              {Object.entries(specifications).map(([key, value], index) => (
                <React.Fragment key={key}>
                  {index > 0 && <Separator />}
                  <div className="flex justify-between items-center py-1 gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground truncate">{key}</span>
                    <span className="text-xs sm:text-sm font-medium text-right">{value}</span>
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
