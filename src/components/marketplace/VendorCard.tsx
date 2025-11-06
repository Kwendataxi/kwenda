import React from 'react';
import { motion } from 'framer-motion';
import { Star, Package, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VendorCardProps {
  vendor: {
    user_id: string;
    shop_name: string;
    shop_logo_url?: string;
    shop_banner_url?: string;
    shop_description?: string;
    average_rating: number;
    total_sales: number;
    product_count: number;
  };
  badge?: 'top' | 'new' | 'similar';
  onVisit: (vendorId: string) => void;
  index?: number;
}

const badgeConfig = {
  top: { label: 'Top Vendeur', className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white badge-glow' },
  new: { label: 'Nouveau', className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white badge-pulse' },
  similar: { label: 'Similaire', className: 'bg-gradient-to-r from-primary to-purple-600 text-white' },
};

export const VendorCard: React.FC<VendorCardProps> = ({ vendor, badge, onVisit, index = 0 }) => {
  const badgeInfo = badge ? badgeConfig[badge] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="vendor-card-hover vendor-card-glass rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col"
      onClick={() => onVisit(vendor.user_id)}
    >
      {/* Header with banner */}
      <div className="relative h-32 overflow-hidden">
        {vendor.shop_banner_url ? (
          <img
            src={vendor.shop_banner_url}
            alt={vendor.shop_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Badge */}
        {badgeInfo && (
          <Badge className={`absolute top-3 right-3 ${badgeInfo.className} font-semibold text-xs px-3 py-1`}>
            {badgeInfo.label}
          </Badge>
        )}

        {/* Floating Avatar */}
        <motion.div
          className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 vendor-avatar-float"
          whileHover={{ scale: 1.1, y: -4 }}
        >
          <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-background shadow-lg">
            {vendor.shop_logo_url ? (
              <img
                src={vendor.shop_logo_url}
                alt={vendor.shop_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {vendor.shop_name[0]?.toUpperCase() || 'V'}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 pt-14">
        {/* Shop name */}
        <h3 className="text-lg font-bold text-center mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {vendor.shop_name}
        </h3>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold">{vendor.average_rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-semibold">{vendor.total_sales}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">{vendor.product_count}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center line-clamp-2 mb-4 flex-1">
          {vendor.shop_description || 'Découvrez les produits de cette boutique'}
        </p>

        {/* CTA Button */}
        <Button
          variant="outline"
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onVisit(vendor.user_id);
          }}
        >
          Visiter
          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
};
