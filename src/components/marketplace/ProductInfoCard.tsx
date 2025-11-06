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
    <Card className="border-2">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Title & Badges */}
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold line-clamp-2">
            {title}
          </h2>
          
          {/* Badges inline */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{category}</Badge>
            <Badge variant="outline">{condition}</Badge>
            {discount > 0 && (
              <Badge className="bg-destructive">-{discount}%</Badge>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${
                  i <= Math.floor(rating) 
                    ? 'fill-yellow-500 text-yellow-500' 
                    : 'text-muted-foreground'
                }`} 
              />
            ))}
          </div>
          <span className="font-semibold">{rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({reviewCount} avis)</span>
        </div>
        
        <Separator />
        
        {/* Prix avec animation */}
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="space-y-2"
        >
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-bold text-primary">
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </motion.div>
        
        <Separator />
        
        {/* Grille infos clés */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stock</p>
            <Badge className={stockCount > 5 ? 'bg-green-600' : 'bg-orange-500'}>
              <Package className="h-3 w-3 mr-1" />
              {stockCount} disponibles
            </Badge>
          </div>
          {brand && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Marque</p>
              <p className="text-sm font-semibold">{brand}</p>
            </div>
          )}
        </div>
        
        {/* Description mobile (accordéon) */}
        <div className="lg:hidden">
          <Accordion type="single" collapsible>
            <AccordionItem value="desc" className="border-none">
              <AccordionTrigger className="text-base font-semibold">
                Description
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};
