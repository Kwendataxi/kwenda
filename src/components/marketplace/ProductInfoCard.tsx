import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Download, FileText } from 'lucide-react';

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
  // Champs produits digitaux
  isDigital?: boolean;
  digitalFileName?: string;
  digitalFileSize?: number;
  digitalDownloadLimit?: number;
  digitalFileType?: string;
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
  discount = 0,
  isDigital = false,
  digitalFileName,
  digitalFileSize,
  digitalDownloadLimit = 5,
  digitalFileType
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (type?: string) => {
    if (!type) return null;
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/zip': 'ZIP',
      'application/x-rar-compressed': 'RAR',
      'audio/mpeg': 'MP3',
      'video/mp4': 'MP4',
      'image/jpeg': 'JPG',
      'image/png': 'PNG'
    };
    return typeMap[type] || type.split('/').pop()?.toUpperCase() || 'Fichier';
  };

  const originalPrice = discount > 0 ? price / (1 - discount / 100) : null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold line-clamp-2">
          {title}
        </h2>
        
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          {isDigital ? (
            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              <Download className="h-3 w-3 mr-1" />
              Digital
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">{condition}</Badge>
          )}
          <Badge variant="secondary" className="text-xs">{category}</Badge>
          {discount > 0 && (
            <Badge className="bg-destructive text-xs">-{discount}%</Badge>
          )}
          
          {/* Stock ou info digital */}
          {!isDigital && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className={stockCount > 5 ? 'text-green-600' : 'text-orange-500'}>
                {stockCount} en stock
              </span>
            </>
          )}
        </div>
        
        {/* Info fichier digital */}
        {isDigital && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {digitalFileType && (
                <span className="font-medium text-blue-700 dark:text-blue-400">
                  {getFileTypeLabel(digitalFileType)}
                </span>
              )}
              {digitalFileSize && (
                <span className="text-muted-foreground">
                  {formatFileSize(digitalFileSize)}
                </span>
              )}
              <span className="text-muted-foreground">•</span>
              <span className="text-blue-600 dark:text-blue-400">
                {digitalDownloadLimit} téléchargements inclus
              </span>
            </div>
          </div>
        )}
        
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
