import React from 'react';
import { motion } from 'framer-motion';
import { Star, Package, TrendingUp, ChevronRight, MessageCircle, Verified, Users } from 'lucide-react';
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
    follower_count?: number;
  };
  badge?: 'top' | 'new' | 'similar';
  onVisit: (vendorId: string) => void;
  index?: number;
}

const badgeConfig = {
  top: { 
    label: '🏆 Top Vendeur', 
    className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30' 
  },
  new: { 
    label: '✨ Nouveau', 
    className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-500/30' 
  },
  similar: { 
    label: '💡 Similaire', 
    className: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg' 
  },
};

export const VendorCard: React.FC<VendorCardProps> = ({ vendor, badge, onVisit, index = 0 }) => {
  const { openChat } = useChat();
  const { createOrFindConversation } = useUniversalChat();
  const badgeInfo = badge ? badgeConfig[badge] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="relative bg-card border-2 border-border/30 shadow-xl hover:shadow-[0_25px_60px_-12px_rgba(249,115,22,0.35)] hover:border-orange-300 rounded-3xl overflow-hidden group cursor-pointer h-full flex flex-col transition-all duration-500"
      onClick={() => onVisit(vendor.user_id)}
    >
      {/* Header with gradient banner */}
      <div className="relative h-28 overflow-hidden">
        {vendor.shop_banner_url ? (
          <motion.img
            src={vendor.shop_banner_url}
            alt={vendor.shop_name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 animate-gradient-shift" 
               style={{ backgroundSize: '200% 200%' }} />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8 }}
        />

        {/* Badge with animation */}
        {badgeInfo && (
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
            className="absolute top-3 right-3"
          >
            <Badge className={`${badgeInfo.className} font-bold text-xs px-3 py-1`}>
              {badgeInfo.label}
            </Badge>
          </motion.div>
        )}

        {/* Floating Avatar - Instagram style */}
        <motion.div
          className="absolute -bottom-12 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="relative">
            {/* Animated ring */}
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-card shadow-2xl">
              {vendor.shop_logo_url ? (
                <img
                  src={vendor.shop_logo_url}
                  alt={vendor.shop_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-3xl font-black">
                  {vendor.shop_name[0]?.toUpperCase() || 'V'}
                </div>
              )}
            </div>
            {/* Verified badge */}
            {vendor.total_sales > 10 && (
              <motion.div 
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Verified className="h-5 w-5 text-orange-500" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 pt-16 relative z-10">
        {/* Shop name */}
        <h3 className="text-xl font-black text-center mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {vendor.shop_name}
        </h3>
        
        {/* Followers count */}
        {vendor.follower_count !== undefined && vendor.follower_count > 0 && (
          <p className="text-xs text-muted-foreground text-center mb-3">
            <Users className="h-3 w-3 inline mr-1" />
            {vendor.follower_count.toLocaleString()} abonnés
          </p>
        )}

        {/* Stats Grid - Premium style */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div 
            whileHover={{ scale: 1.08, y: -3 }}
            className="flex flex-col items-center gap-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl py-2.5 px-2 border border-amber-200/50 dark:border-amber-800/50"
          >
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            <span className="text-sm font-black text-foreground">{vendor.average_rating.toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">Note</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.08, y: -3 }}
            className="flex flex-col items-center gap-1 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-2xl py-2.5 px-2 border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-black text-foreground">{vendor.total_sales}</span>
            <span className="text-[10px] text-muted-foreground">Ventes</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.08, y: -3 }}
            className="flex flex-col items-center gap-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl py-2.5 px-2 border border-blue-200/50 dark:border-blue-800/50"
          >
            <Package className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-black text-foreground">{vendor.product_count}</span>
            <span className="text-[10px] text-muted-foreground">Produits</span>
          </motion.div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center line-clamp-2 mb-4 flex-1 leading-relaxed">
          {vendor.shop_description || 'Découvrez les produits exclusifs de cette boutique'}
        </p>

        {/* CTA Buttons - Orange theme */}
        <div className="grid grid-cols-2 gap-2.5">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/30"
              onClick={(e) => {
                e.stopPropagation();
                onVisit(vendor.user_id);
              }}
            >
              Visiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className="w-full font-bold border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
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
