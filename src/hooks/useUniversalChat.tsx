import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UniversalConversation {
  id: string;
  context_type: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
  context_id?: string;
  participant_1: string;
  participant_2: string;
  title?: string;
  status: 'active' | 'archived' | 'closed';
  metadata: any;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  other_participant?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  unread_count?: number;
}

export interface UniversalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'location' | 'image' | 'file' | 'quick_action';
  metadata: any;
  attachments: any[];
  is_read: boolean;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useUniversalChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<UniversalConversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: UniversalMessage[] }>({});
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: conversationsData, error } = await supabase
        .from('unified_conversations')
        .select(`
          *,
          unified_messages!inner(id, is_read, created_at, sender_id)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch participant profiles
      const participantIds = [...new Set(
        conversationsData?.flatMap(conv => [conv.participant_1, conv.participant_2]) || []
      )].filter(id => id !== user.id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', participantIds);

      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as any) || {};

      const enrichedConversations = conversationsData?.map(conv => {
        const otherParticipantId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
        const unreadCount = conv.unified_messages?.filter((msg: any) => !msg.is_read && msg.sender_id !== user.id).length || 0;
        
        return {
          id: conv.id,
          context_type: conv.context_type as 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support',
          context_id: conv.context_id,
          participant_1: conv.participant_1,
          participant_2: conv.participant_2,
          title: conv.title,
          status: conv.status as 'active' | 'archived' | 'closed',
          metadata: conv.metadata,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          other_participant: {
            id: otherParticipantId,
            display_name: profilesMap[otherParticipantId]?.display_name || 'Utilisateur',
            avatar_url: profilesMap[otherParticipantId]?.avatar_url,
          },
          unread_count: unreadCount,
        } as UniversalConversation;
      }) || [];

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('unified_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(messagesData?.map(msg => msg.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds);

      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as any) || {};

      const enrichedMessages = messagesData?.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type as 'text' | 'location' | 'image' | 'file' | 'quick_action',
        metadata: msg.metadata,
        attachments: msg.attachments || [],
        is_read: msg.is_read,
        reply_to_id: msg.reply_to_id,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender: {
          id: msg.sender_id,
          display_name: profilesMap[msg.sender_id]?.display_name || 'Utilisateur',
          avatar_url: profilesMap[msg.sender_id]?.avatar_url,
        },
      } as UniversalMessage)) || [];

      setMessages(prev => ({
        ...prev,
        [conversationId]: enrichedMessages,
      }));

      // Mark messages as read
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('unified_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'location' | 'image' | 'file' | 'quick_action' = 'text',
    metadata: any = {},
    attachments: any[] = []
  ) => {
    if (!user || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('unified_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: messageType,
          metadata,
          attachments,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('unified_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user]);

  const createOrFindConversation = useCallback(async (
    contextType: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support',
    participantId: string,
    contextId?: string,
    title?: string,
    metadata: any = {}
  ) => {
    if (!user) return null;

    try {
      // First try to find existing conversation
      let query = supabase
        .from('unified_conversations')
        .select('*')
        .eq('context_type', contextType)
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${participantId}),and(participant_1.eq.${participantId},participant_2.eq.${user.id})`);
      query = contextId ? query.eq('context_id', contextId) : query.is('context_id', null);
      const { data: existing } = await query.maybeSingle();

      if (existing) {
        return existing;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('unified_conversations')
        .insert({
          context_type: contextType,
          context_id: contextId,
          participant_1: user.id,
          participant_2: participantId,
          title,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/finding conversation:', error);
      throw error;
    }
  }, [user]);

  const sendLocationMessage = useCallback(async (conversationId: string) => {
    if (!navigator.geolocation) {
      throw new Error('Géolocalisation non supportée');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            };

            const message = await sendMessage(
              conversationId,
              'Position partagée',
              'location',
              locationData
            );
            resolve(message);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error('Impossible d\'obtenir la position'));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [sendMessage]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const conversationsChannel = supabase
      .channel('unified_conversations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unified_conversations' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('unified_messages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unified_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as any;
            setMessages(prev => ({
              ...prev,
              [newMessage.conversation_id]: [
                ...(prev[newMessage.conversation_id] || []),
                { ...newMessage },
              ],
            }));
            // Refresh conversations to update unread counts and ordering
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendLocationMessage,
    createOrFindConversation,
    markMessagesAsRead,
  };
};