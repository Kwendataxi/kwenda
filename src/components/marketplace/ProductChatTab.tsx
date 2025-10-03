import React from 'react';
import { ModernChatInterface } from './ModernChatInterface';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

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
    <div className="h-full flex flex-col">
      {/* Quick actions header */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Discuter avec le vendeur
          </span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        {/* Quick message templates */}
        <div className="flex flex-wrap gap-1.5">
          <button className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
            Est-il disponible ?
          </button>
          <button className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
            Meilleur prix ?
          </button>
          <button className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
            Où se trouve-t-il ?
          </button>
          <button className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
            Peut-on se rencontrer ?
          </button>
        </div>
      </div>

      {/* Chat interface - Fixed height */}
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
