import React, { useMemo } from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { Badge } from '@/components/ui/badge';

export const MessagesTab: React.FC = () => {
  const { conversations } = useUniversalChat();

  const marketplaceConversations = useMemo(() => {
    return conversations.filter(conv => conv.context_type === 'marketplace');
  }, [conversations]);

  const unreadCount = useMemo(() => {
    return marketplaceConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [marketplaceConversations]);

  return (
    <div className="h-[calc(100vh-180px)] min-h-[450px] flex flex-col bg-background rounded-2xl overflow-hidden border border-border/20 shadow-sm">
      {/* Header informatif */}
      {marketplaceConversations.length > 0 && (
        <div className="px-4 py-3 border-b border-border/30 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Messages</h2>
              <p className="text-xs text-muted-foreground">
                {marketplaceConversations.length} conversation{marketplaceConversations.length > 1 ? 's' : ''}
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-primary/90 text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Interface de chat */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <UniversalChatInterface
          contextType="marketplace"
          isFloating={false}
          hideHeader={marketplaceConversations.length > 0}
        />
      </div>
    </div>
  );
};
