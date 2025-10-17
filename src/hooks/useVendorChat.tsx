import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ChatConversation {
  id: string;
  product_id: string;
  buyer_id: string;
  status: string;
  last_message_at: string;
  unread_count: number;
}

export const useVendorChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadConversations();
    subscribeToConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data: chats, error }: any = await supabase
        .from('marketplace_chats')
        .select('id, product_id, buyer_id, status, last_message_at')
        .eq('seller_id', user.id);

      if (error) throw error;

      const conversationsWithUnread = await Promise.all(
        (chats || []).map(async (chat: any) => {
          const { count }: any = await supabase
            .from('marketplace_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...chat,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    if (!user) return;

    const channel = supabase
      .channel('vendor-chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_messages'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  }, [conversations]);

  const activeConversations = useMemo(() => {
    return conversations.filter(conv => conv.status === 'active');
  }, [conversations]);

  return {
    conversations,
    loading,
    totalUnread,
    activeConversations,
    refreshConversations: loadConversations
  };
};
