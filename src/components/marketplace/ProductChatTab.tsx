import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ModernChatInterface } from './ModernChatInterface';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { MessageCircle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const { startConversation } = useMarketplaceChat();
  const [conversationId, setConversationId] = useState<string | undefined>();

  // Auto-create or find conversation when opening tab
  useEffect(() => {
    const initConversation = async () => {
      if (productId && sellerId) {
        const id = await startConversation(productId, sellerId);
        if (id) setConversationId(id);
      }
    };
    initConversation();
  }, [productId, sellerId, startConversation]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header compact avec info vendeur */}
      <div className="shrink-0 p-3 border-b bg-gradient-to-r from-primary/5 to-orange-500/5">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 bg-primary/10 rounded-full"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Discussion avec le vendeur</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Package className="h-3 w-3" />
              {productTitle}
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
            ✅ En ligne
          </Badge>
        </div>
      </div>

      {/* Chat moderne unifié - Full height */}
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
