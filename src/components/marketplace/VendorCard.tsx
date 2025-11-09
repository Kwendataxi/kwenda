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
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative backdrop-blur-xl bg-gradient-to-br from-card/95 via-card/80 to-card/95 border border-border/50 shadow-xl hover:shadow-2xl hover:border-primary/30 rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col transition-all duration-300"
      onClick={() => onVisit(vendor.user_id)}
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-xl" />

      {/* Header with banner */}
      <div className="relative h-24 overflow-hidden">
        {vendor.shop_banner_url ? (
          <img
            src={vendor.shop_banner_url}
            alt={vendor.shop_name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-500/30 to-pink-500/30 group-hover:from-primary/40 group-hover:via-purple-500/40 group-hover:to-pink-500/40 transition-all duration-500" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-300" />
        
        {/* Diagonal shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badge with animation */}
        {badgeInfo && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
          >
            <Badge className={`absolute top-2 right-2 ${badgeInfo.className} font-semibold text-xs px-2.5 py-0.5 shadow-lg`}>
              {badgeInfo.label}
            </Badge>
          </motion.div>
        )}

        {/* Floating Avatar */}
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.15, rotate: 5, y: -6 }}
        >
          <div className="w-16 h-16 rounded-full border-4 border-background overflow-hidden bg-background shadow-xl group-hover:shadow-2xl group-hover:shadow-primary/30 transition-all relative">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full ring-2 ring-primary/0 group-hover:ring-primary/50 transition-all duration-300" />
            {vendor.shop_logo_url ? (
              <img
                src={vendor.shop_logo_url}
                alt={vendor.shop_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {vendor.shop_name[0]?.toUpperCase() || 'V'}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-3 pt-12 relative z-10">
        {/* Shop name */}
        <h3 className="text-base font-bold text-center mb-1.5 line-clamp-1 group-hover:text-primary transition-colors duration-300">
          {vendor.shop_name}
        </h3>

        {/* Stats - Compact badges */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <div className="flex flex-col items-center gap-0.5 bg-yellow-500/10 rounded-lg py-1.5 px-2 border border-yellow-500/20 transition-all hover:bg-yellow-500/20">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-bold text-foreground">{vendor.average_rating.toFixed(1)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-green-500/10 rounded-lg py-1.5 px-2 border border-green-500/20 transition-all hover:bg-green-500/20">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-bold text-foreground">{vendor.total_sales}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-blue-500/10 rounded-lg py-1.5 px-2 border border-blue-500/20 transition-all hover:bg-blue-500/20">
            <Package className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold text-foreground">{vendor.product_count}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground text-center line-clamp-2 mb-3 flex-1 leading-relaxed">
          {vendor.shop_description || 'Découvrez les produits de cette boutique'}
        </p>

        {/* CTA Button - Premium gradient */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full"
        >
          <Button
            variant="default"
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all group/btn relative overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              onVisit(vendor.user_id);
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <span className="relative z-10 flex items-center justify-center gap-2">
              Visiter
              <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
