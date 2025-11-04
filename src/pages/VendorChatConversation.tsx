import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ChatInfo {
  id: string;
  product_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_avatar?: string;
  product_title: string;
  product_price: number;
  product_image?: string;
}

export default function VendorChatConversation() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (conversationId && user) {
      loadChatData();
      subscribeToMessages();
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatData = async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);

      // Charger les infos du chat
      const { data: chat, error: chatError } = await supabase
        .from('marketplace_chats')
        .select(`
          id,
          product_id,
          buyer_id,
          products:marketplace_products(title, price, images),
          buyer:profiles!marketplace_chats_buyer_id_fkey(display_name, profile_photo_url)
        `)
        .eq('id', conversationId)
        .eq('seller_id', user.id)
        .single();

      if (chatError) throw chatError;

      if (!chat) {
        toast({
          title: "Erreur",
          description: "Conversation introuvable",
          variant: "destructive"
        });
        navigate('/vendeur');
        return;
      }

      setChatInfo({
        id: chat.id,
        product_id: chat.product_id,
        buyer_id: chat.buyer_id,
        buyer_name: (chat.buyer as any)?.display_name || 'Client',
        buyer_avatar: (chat.buyer as any)?.profile_photo_url,
        product_title: (chat.products as any)?.title || 'Produit',
        product_price: (chat.products as any)?.price || 0,
        product_image: (chat.products as any)?.images?.[0]
      });

      // Charger les messages
      const { data: msgs, error: msgsError } = await supabase
        .from('marketplace_messages')
        .select('*')
        .eq('chat_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;

      setMessages(msgs || []);

      // Marquer les messages comme lus
      await supabase
        .from('marketplace_messages')
        .update({ is_read: true })
        .eq('chat_id', conversationId)
        .neq('sender_id', user.id);

    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `chat_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !user || !chatInfo) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('marketplace_messages')
        .insert([{
          chat_id: conversationId,
          sender_id: user.id,
          message: messageText.trim(),
          message_type: 'text',
          is_read: false
        }]);

      if (error) throw error;

      // Mettre à jour le chat avec le dernier message
      await supabase
        .from('marketplace_chats')
        .update({ 
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  if (!chatInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Conversation introuvable</p>
          <Button onClick={() => navigate('/vendeur')} className="mt-4">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/vendeur')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarImage src={chatInfo.buyer_avatar} />
            <AvatarFallback>
              {chatInfo.buyer_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{chatInfo.buyer_name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {chatInfo.product_title}
            </p>
          </div>
        </div>
      </header>

      {/* Product Info */}
      <div className="container max-w-4xl mx-auto px-4 py-3 border-b">
        <Card className="p-3">
          <div className="flex gap-3">
            {chatInfo.product_image ? (
              <img
                src={chatInfo.product_image}
                alt={chatInfo.product_title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{chatInfo.product_title}</p>
              <p className="text-lg font-bold text-primary">
                {chatInfo.product_price.toLocaleString()} FC
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-4 space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Écrire un message..."
              disabled={sending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
