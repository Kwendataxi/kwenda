import React, { useMemo } from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

export const MessagesTab: React.FC = () => {
  const { conversations } = useUniversalChat();

  const marketplaceConversations = useMemo(() => {
    return conversations.filter(conv => conv.context_type === 'marketplace');
  }, [conversations]);

  const unreadCount = useMemo(() => {
    return marketplaceConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [marketplaceConversations]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header moderne et épuré */}
      {marketplaceConversations.length > 0 && (
        <div className="px-4 py-3 border-b border-border/50 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-foreground">Messages</span>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Interface de chat */}
      <div className="flex-1 min-h-0">
        <UniversalChatInterface
          contextType="marketplace"
          isFloating={false}
          hideHeader={marketplaceConversations.length > 0}
        />
      </div>
    </div>
  );
};
