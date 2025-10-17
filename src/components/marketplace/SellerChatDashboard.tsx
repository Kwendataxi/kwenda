import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  CheckCircle, 
  Clock,
  User,
  Package
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversationCardProps {
  conversation: any;
  unreadCount: number;
  onClick: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  unreadCount,
  onClick
}) => {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-accent transition-colors border-l-4 border-l-primary/20 hover:border-l-primary"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {conversation.other_participant?.avatar_url ? (
            <img
              src={conversation.other_participant.avatar_url}
              alt={conversation.other_participant.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
              {conversation.other_participant?.display_name?.[0]?.toUpperCase()}
            </div>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm truncate">
              {conversation.other_participant?.display_name}
            </h4>
            <span className="text-xs text-muted-foreground">
              {formatDistance(new Date(conversation.last_message_at), new Date(), {
                addSuffix: true,
                locale: fr
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground truncate flex-1">
              {conversation.product?.title}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary">
              {conversation.product?.price?.toLocaleString()} CDF
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const SellerChatDashboard: React.FC = () => {
  const { user } = useAuth();
  const { conversations, messages } = useMarketplaceChat();

  // Filter conversations where user is the seller
  const sellerConversations = conversations
    .filter(conv => conv.seller_id === user?.id)
    .sort((a, b) => {
      // Prioritize unread messages
      const unreadA = (messages[a.id] || []).filter(
        m => !m.is_read && m.sender_id !== user?.id
      ).length;
      const unreadB = (messages[b.id] || []).filter(
        m => !m.is_read && m.sender_id !== user?.id
      ).length;
      
      if (unreadA !== unreadB) return unreadB - unreadA;

      // Then by date
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

  const activeConversations = sellerConversations.filter(c => c.status === 'active');
  const completedConversations = sellerConversations.filter(c => c.status === 'completed');
  
  const totalUnread = sellerConversations.reduce((total, conv) => {
    return total + (messages[conv.id] || []).filter(
      m => !m.is_read && m.sender_id !== user?.id
    ).length;
  }, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header avec stats */}
      <div className="p-4 border-b bg-card">
        <h2 className="text-xl font-bold mb-3">Messages clients</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <MessageCircle className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">
              {activeConversations.length}
            </p>
            <p className="text-xs text-muted-foreground">Actives</p>
          </Card>
          
          <Card className="p-3 text-center">
            <Clock className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-500">
              {totalUnread}
            </p>
            <p className="text-xs text-muted-foreground">Non lus</p>
          </Card>
          
          <Card className="p-3 text-center">
            <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-500">
              {completedConversations.length}
            </p>
            <p className="text-xs text-muted-foreground">Terminées</p>
          </Card>
        </div>
      </div>

      {/* Liste des conversations */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sellerConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun message pour le moment</p>
            </div>
          ) : (
            sellerConversations.map(conv => {
              const unreadCount = (messages[conv.id] || []).filter(
                m => !m.is_read && m.sender_id !== user?.id
              ).length;

              return (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  unreadCount={unreadCount}
                  onClick={() => {
                    // Open chat - to be implemented
                    console.log('Open conversation:', conv.id);
                  }}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
