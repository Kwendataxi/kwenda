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
    <div className="h-[calc(100vh-180px)] min-h-[450px] flex flex-col bg-background rounded-2xl overflow-hidden border border-border/30 shadow-sm">
      {/* Header moderne et épuré */}
      {marketplaceConversations.length > 0 && (
        <div className="px-4 py-3.5 border-b border-border/40 bg-gradient-to-r from-card via-card to-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Messages</span>
                <p className="text-[11px] text-muted-foreground">Discussions avec les vendeurs</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-xs font-semibold shadow-md shadow-primary/25 animate-pulse">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Interface de chat avec hauteur fixe */}
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
