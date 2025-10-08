import React from 'react';
import { ModernChatInterface } from './ModernChatInterface';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductChatTabProps {
  productId: string;
  sellerId: string;
  productTitle: string;
}

export const ProductChatTab: React.FC<ProductChatTabProps> = ({
  productId,
  sellerId,
  productTitle
}) => {
  const { conversations, messages } = useMarketplaceChat();

  // Find conversation for this product
  const productConversation = conversations.find(
    conv => conv.product_id === productId && conv.seller_id === sellerId
  );

  // Count unread messages for this conversation
  const unreadCount = productConversation
    ? (messages[productConversation.id] || []).filter(msg => !msg.is_read).length
    : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Enhanced Header with seller info */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 p-2.5 sm:p-3 border-b bg-gradient-to-r from-primary/5 to-transparent"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  Chat vendeur
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {productTitle}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
                {unreadCount}
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Chat interface - Full height */}
      <div className="flex-1 overflow-hidden">
        <ModernChatInterface
          productId={productId}
          sellerId={sellerId}
          isCompact={true}
        />
      </div>
    </div>
  );
};
