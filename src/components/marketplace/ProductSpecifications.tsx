import React from 'react';
import { Separator } from '@/components/ui/separator';
import { getConditionLabel } from '@/config/marketplaceCategories';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  return (
    <div className="mb-4 space-y-2">
      {brand && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('product.brand')}</span>
          <span className="font-medium">{brand}</span>
        </div>
      )}
      {condition && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('product.condition')}</span>
          <span className="font-medium">{getConditionLabel(condition)}</span>
        </div>
      )}
      {stockCount !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('product.stock')}</span>
          <span className="font-medium">
            {stockCount} {t(stockCount > 1 ? 'product.available_plural' : 'product.available')}
          </span>
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
