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
  top: { label: 'Top', icon: '🏆', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  new: { label: 'Nouveau', icon: '✨', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  similar: { label: 'Similaire', icon: '💡', className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Card 
        className="p-3 rounded-xl bg-card border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={() => onVisit(vendor.user_id)}
      >
        {/* Header: Logo + Info */}
        <div className="flex items-start gap-3">
          {/* Logo compact */}
          <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-muted">
            {vendor.shop_logo_url ? (
              <img
                src={vendor.shop_logo_url}
                alt={vendor.shop_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold">
                {vendor.shop_name[0]?.toUpperCase() || 'V'}
              </div>
            )}
          </div>
          
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {/* Nom + Badge + Verified */}
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm truncate flex-1">
                {vendor.shop_name}
              </h3>
              {isVerified && (
                <Verified className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              {badgeInfo && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 h-5 font-medium shrink-0 ${badgeInfo.className}`}
                >
                  {badgeInfo.icon}
                </Badge>
              )}
            </div>
            
            {/* Stats inline compactes */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{vendor.average_rating.toFixed(1)}</span>
              </span>
              <span className="text-border/60">•</span>
              <span className="flex items-center gap-0.5">
                <Package className="w-3 h-3" />
                {vendor.product_count}
              </span>
              <span className="text-border/60">•</span>
              <span className="flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {vendor.total_sales}
              </span>
            </div>
          </div>
        </div>

        {/* Boutons compacts */}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs rounded-lg font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onVisit(vendor.user_id);
            }}
          >
            Visiter
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg shrink-0"
            onClick={handleChatClick}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
