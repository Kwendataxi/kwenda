import React from 'react';
import { Separator } from '@/components/ui/separator';
import { getConditionLabel } from '@/config/marketplaceCategories';

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
    <div className="mb-4 space-y-2">
      {brand && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Marque</span>
          <span className="font-medium">{brand}</span>
        </div>
      )}
      {condition && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">État</span>
          <span className="font-medium">{getConditionLabel(condition)}</span>
        </div>
      )}
      {stockCount !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Stock</span>
          <span className="font-medium">{stockCount} disponible{stockCount > 1 ? 's' : ''}</span>
        </div>
      )}
      
      {specifications && Object.keys(specifications).length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="space-y-2">
            {Object.entries(specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
