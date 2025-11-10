import React from 'react';
import { motion } from 'framer-motion';
import { Star, Package, TrendingUp, ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/components/chat/ChatProvider';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { toast } from 'sonner';

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
  const { openChat } = useChat();
  const { createOrFindConversation } = useUniversalChat();
  const badgeInfo = badge ? badgeConfig[badge] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative backdrop-blur-2xl bg-gradient-to-br from-card/90 via-card/70 to-card/90 border-2 border-border/30 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-primary/50 rounded-3xl overflow-hidden group cursor-pointer h-full flex flex-col transition-all duration-500 hover:scale-[1.03]"
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
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-purple-500/40 to-pink-500/40 animate-gradient-shift group-hover:from-primary/50 group-hover:via-purple-500/50 group-hover:to-pink-500/50 transition-all duration-500" />
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

        {/* Floating Avatar - 80px with enhanced glow */}
        <motion.div
          className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.15, rotate: 5, y: -8 }}
        >
          <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-card shadow-2xl group-hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] transition-all relative ring-2 ring-primary/20 group-hover:ring-primary/60">
            {/* Glow effect interne */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
            
            {vendor.shop_logo_url ? (
              <img
                src={vendor.shop_logo_url}
                alt={vendor.shop_name}
                className="w-full h-full object-cover relative z-10"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold relative z-10">
                {vendor.shop_name[0]?.toUpperCase() || 'V'}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 pt-14 relative z-10">
        {/* Shop name */}
        <h3 className="text-lg font-black text-center mb-2 line-clamp-1 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text group-hover:from-primary group-hover:to-purple-600 transition-all duration-300">
          {vendor.shop_name}
        </h3>

        {/* Stats - Animated badges */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex flex-col items-center gap-1 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-xl py-2 px-2 border border-yellow-500/30 backdrop-blur-sm transition-all hover:bg-yellow-500/25 hover:shadow-lg hover:shadow-yellow-500/20"
          >
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 drop-shadow-glow" />
            <span className="text-sm font-bold text-foreground">{vendor.average_rating.toFixed(1)}</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex flex-col items-center gap-1 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl py-2 px-2 border border-green-500/30 backdrop-blur-sm transition-all hover:bg-green-500/25 hover:shadow-lg hover:shadow-green-500/20"
          >
            <TrendingUp className="h-4 w-4 text-green-500 drop-shadow-glow" />
            <span className="text-sm font-bold text-foreground">{vendor.total_sales}</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex flex-col items-center gap-1 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl py-2 px-2 border border-blue-500/30 backdrop-blur-sm transition-all hover:bg-blue-500/25 hover:shadow-lg hover:shadow-blue-500/20"
          >
            <Package className="h-4 w-4 text-blue-500 drop-shadow-glow" />
            <span className="text-sm font-bold text-foreground">{vendor.product_count}</span>
          </motion.div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground/90 text-center line-clamp-2 mb-4 flex-1 leading-relaxed font-medium">
          {vendor.shop_description || 'Découvrez les produits de cette boutique'}
        </p>

        {/* CTA Buttons - Dual action */}
        <div className="grid grid-cols-2 gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="default"
              size="sm"
              className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-700 hover:to-pink-700 text-sm font-bold shadow-xl shadow-primary/30 border-0"
              onClick={(e) => {
                e.stopPropagation();
                onVisit(vendor.user_id);
              }}
            >
              Visiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full text-sm font-bold border-primary/30 hover:bg-primary/10"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const conversation = await createOrFindConversation(
                    'marketplace',
                    vendor.user_id,
                    undefined,
                    `Chat avec ${vendor.shop_name}`
                  );
                  
                  if (conversation) {
                    openChat({
                      contextType: 'marketplace',
                      participantId: vendor.user_id,
                      title: `Chat avec ${vendor.shop_name}`,
                      quickActions: [
                        { label: '📦 Produits disponibles ?', action: () => {} },
                        { label: '💰 Prix négociable ?', action: () => {} },
                        { label: '📍 Lieu de retrait ?', action: () => {} },
                      ]
                    });
                  }
                } catch (error) {
                  console.error('Erreur chat:', error);
                  toast.error('Impossible d\'ouvrir le chat');
                }
              }}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
