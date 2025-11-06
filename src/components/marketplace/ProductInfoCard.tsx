import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Package } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ProductInfoCardProps {
  title: string;
  category: string;
  condition: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  stockCount: number;
  brand?: string;
  discount?: number;
}

export const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  title,
  category,
  condition,
  description,
  price,
  rating,
  reviewCount,
  stockCount,
  brand,
  discount = 0
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const originalPrice = discount > 0 ? price / (1 - discount / 100) : null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold line-clamp-2">
          {title}
        </h2>
        
        {/* Badges + Stock inline */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <Badge variant="secondary" className="text-xs">{category}</Badge>
          <Badge variant="outline" className="text-xs">{condition}</Badge>
          {discount > 0 && (
            <Badge className="bg-destructive text-xs">-{discount}%</Badge>
          )}
          <span className="text-muted-foreground">•</span>
          <span className={stockCount > 5 ? 'text-green-600' : 'text-orange-500'}>
            {stockCount} en stock
          </span>
        </div>
        
        {/* Rating inline */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${
                  i <= Math.floor(rating) 
                    ? 'fill-yellow-500 text-yellow-500' 
                    : 'text-muted-foreground'
                }`} 
              />
            ))}
          </div>
          <span className="font-medium">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({reviewCount})</span>
        </div>
        
        {/* Prix simplifié */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl font-bold text-primary">
            {formatPrice(price)}
          </span>
          {originalPrice && (
            <span className="text-base text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        
        {/* Description visible directement (mobile) */}
        <div className="lg:hidden">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
