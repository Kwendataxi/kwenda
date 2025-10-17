import React, { useState, useEffect } from 'react';
import { ModernChatInterface } from './ModernChatInterface';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { User } from 'lucide-react';

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
      <div className="shrink-0 p-2 sm:p-2.5 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Discussion avec le vendeur</p>
            <p className="text-xs text-muted-foreground truncate">{productTitle}</p>
          </div>
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
