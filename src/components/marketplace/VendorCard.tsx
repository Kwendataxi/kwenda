import React from 'react';
import { motion } from 'framer-motion';
import { Star, Package, TrendingUp, ChevronRight, MessageCircle, Verified } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  top: { label: 'Top Vendeur', icon: '🏆' },
  new: { label: 'Nouveau', icon: '✨' },
  similar: { label: 'Similaire', icon: '💡' },
};

export const VendorCard: React.FC<VendorCardProps> = ({ vendor, badge, onVisit, index = 0 }) => {
  const { openChat } = useChat();
  const { createOrFindConversation } = useUniversalChat();
  const badgeInfo = badge ? badgeConfig[badge] : null;
  const isVerified = vendor.total_sales > 10;

  const handleChatClick = async (e: React.MouseEvent) => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col"
        onClick={() => onVisit(vendor.user_id)}
      >
        {/* Banner compact with integrated logo */}
        <div className="relative h-32">
          {vendor.shop_banner_url ? (
            <img
              src={vendor.shop_banner_url}
              alt={vendor.shop_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary to-primary/60" />
          )}
          
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Logo - small corner position */}
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl border-2 border-background shadow-lg overflow-hidden bg-background">
            {vendor.shop_logo_url ? (
              <img
                src={vendor.shop_logo_url}
                alt={vendor.shop_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-lg font-bold">
                {vendor.shop_name[0]?.toUpperCase() || 'V'}
              </div>
            )}
          </div>
          
          {/* Badge - small and discreet */}
          {badgeInfo && (
            <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-0.5">
              {badgeInfo.icon} {badgeInfo.label}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 space-y-3">
          {/* Shop name + verified */}
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg line-clamp-1 flex-1">
              {vendor.shop_name}
            </h3>
            {isVerified && (
              <Verified className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </div>
          
          {/* Stats inline horizontal */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{vendor.average_rating.toFixed(1)}</span>
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {vendor.product_count}
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {vendor.total_sales}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {vendor.shop_description || 'Découvrez les produits de cette boutique'}
          </p>

          {/* Buttons - sober design */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 rounded-full font-medium"
              onClick={(e) => {
                e.stopPropagation();
                onVisit(vendor.user_id);
              }}
            >
              Visiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={handleChatClick}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
