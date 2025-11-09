import React, { useMemo } from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';

export const MessagesTab: React.FC = () => {
  const { conversations } = useUniversalChat();

  // ✅ FILTRER UNIQUEMENT LES CONVERSATIONS MARKETPLACE
  const marketplaceConversations = useMemo(() => {
    return conversations.filter(conv => conv.context_type === 'marketplace');
  }, [conversations]);

  const unreadCount = useMemo(() => {
    return marketplaceConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [marketplaceConversations]);

  console.log('📩 [MessagesTab] Conversations marketplace:', marketplaceConversations.length);
  console.log('🔴 [MessagesTab] Messages non lus:', unreadCount);

  return (
    <div className="h-full flex flex-col">
      {/* Header avec compteur */}
      {marketplaceConversations.length > 0 && (
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Messages avec vendeurs</h2>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount} non lus
            </Badge>
          )}
        </div>
      )}

      {/* Interface de chat filtrée */}
      <div className="flex-1">
        <UniversalChatInterface
          contextType="marketplace"
          isFloating={false}
          hideHeader={marketplaceConversations.length > 0}
        />
      </div>
    </div>
  );
};
