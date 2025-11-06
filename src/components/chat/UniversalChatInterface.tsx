import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  MapPin, 
  Phone, 
  MoreVertical,
  X,
  ArrowLeft,
  Image as ImageIcon,
  Paperclip,
  Minus
} from 'lucide-react';
import { useUniversalChat, type UniversalConversation, type UniversalMessage } from '@/hooks/useUniversalChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotificationService';
import { notificationSoundService } from '@/services/notificationSound';

interface UniversalChatInterfaceProps {
  isFloating?: boolean;
  onClose?: () => void;
  contextType?: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
  contextId?: string;
  participantId?: string;
  title?: string;
  quickActions?: { label: string; action: () => void; icon?: any }[];
  hideHeader?: boolean;
}

export const UniversalChatInterface = ({
  isFloating = false,
  onClose,
  contextType,
  contextId,
  participantId,
  title,
  quickActions = [],
  hideHeader = false
}: UniversalChatInterfaceProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const {
    conversations,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    sendLocationMessage,
    createOrFindConversation
  } = useUniversalChat();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Écouter les nouvelles notifications push pour les messages en temps réel
  useEffect(() => {
    if (!user) return;

    const notificationChannel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'push_notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const notification = payload.new as any;
          
          // Afficher notification navigateur si type = chat_message
          if (notification.type === 'chat_message') {
            await notificationSoundService.playNotificationSound('message');
            await pushNotificationService.showNotification(
              notification.title,
              {
                body: notification.body,
                tag: notification.data?.conversation_id,
                data: {
                  url: `/chat?conversation=${notification.data?.conversation_id}`
                },
                requireInteraction: false
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [user]);

  // Auto-select conversation if contextType and participantId provided
  useEffect(() => {
    if (contextType && participantId && !selectedConversation) {
      const existingConv = conversations.find(conv => 
        conv.context_type === contextType && 
        conv.context_id === contextId &&
        conv.other_participant?.id === participantId
      );

      if (existingConv) {
        setSelectedConversation(existingConv.id);
        fetchMessages(existingConv.id);
      } else {
        createOrFindConversation(contextType, participantId, contextId, title)
          .then((conv) => {
            if (conv) {
              setSelectedConversation(conv.id);
              fetchMessages(conv.id);
            }
          });
      }
    }
  }, [contextType, participantId, contextId, title, conversations, selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(selectedConversation, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendLocation = async () => {
    if (!selectedConversation) return;

    try {
      await sendLocationMessage(selectedConversation);
    } catch (error) {
      console.error('Error sending location:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isFloating && isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          aria-label="Ouvrir la messagerie"
          className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl ring-1 ring-border/50 backdrop-blur transition-all hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
          {conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0) > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
              {conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0)}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  const containerClass = isFloating
    ? "fixed inset-0 md:inset-auto md:bottom-4 md:right-4 w-full h-[100dvh] md:w-96 md:h-[520px] z-50 shadow-2xl rounded-none md:rounded-2xl border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    : "w-full h-full";

  return (
    <Card className={cn("flex flex-col", containerClass)}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-background/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h3 className="font-semibold">
                {selectedConversation 
                  ? conversations.find(c => c.id === selectedConversation)?.other_participant?.display_name || 'Chat'
                  : 'Messages'
                }
              </h3>
              {selectedConversation && (
                <p className="text-sm text-muted-foreground">
                  {conversations.find(c => c.id === selectedConversation)?.context_type}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFloating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="p-1"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content - Chat uniquement */}
      <div className="flex-1 flex flex-col min-h-0">
        {!selectedConversation ? (
          <ConversationsList
            conversations={conversations}
            onSelectConversation={(id) => {
              setSelectedConversation(id);
              fetchMessages(id);
            }}
            loading={loading}
          />
        ) : (
          <ChatView
            messages={conversationMessages}
            onSendMessage={handleSendMessage}
            onSendLocation={handleSendLocation}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onKeyPress={handleKeyPress}
            quickActions={quickActions}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>
    </Card>
  );
};

interface ConversationsListProps {
  conversations: UniversalConversation[];
  onSelectConversation: (id: string) => void;
  loading: boolean;
}

const ConversationsList = ({ conversations, onSelectConversation, loading }: ConversationsListProps) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.other_participant?.avatar_url} />
              <AvatarFallback>
                {conversation.other_participant?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate">
                  {conversation.other_participant?.display_name || 'Utilisateur'}
                </p>
                {conversation.unread_count && conversation.unread_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {conversation.context_type}
              </p>
              <p className="text-xs text-muted-foreground">
                {conversation.last_message_at && 
                  new Date(conversation.last_message_at).toLocaleDateString()
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

interface ChatViewProps {
  messages: UniversalMessage[];
  onSendMessage: () => void;
  onSendLocation: () => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  quickActions: { label: string; action: () => void; icon?: any }[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatView = ({
  messages,
  onSendMessage,
  onSendLocation,
  newMessage,
  setNewMessage,
  onKeyPress,
  quickActions,
  messagesEndRef
}: ChatViewProps) => {
  return (
    <>
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions - Horizontal scroll moderne */}
      {quickActions.length > 0 && (
        <div className="px-3 py-2 border-t bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-1">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    action.action();
                    setNewMessage(action.label.replace(/[👋📦🏷️📍]/g, '').trim());
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 hover:shadow-sm transition-all border border-primary/20"
                >
                  {action.icon && <action.icon className="h-3.5 w-3.5" />}
                  {action.label}
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Input moderne avec glassmorphism */}
      <div className="p-3 border-t bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex gap-2">
          <Button 
            onClick={onSendLocation} 
            variant="outline" 
            size="icon"
            className="h-11 w-11 rounded-xl border-2 hover:bg-primary/10 hover:border-primary"
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="Tapez votre message..."
              className="h-11 rounded-xl border-2 focus:border-primary pr-12 text-sm"
            />
            <Button 
              onClick={onSendMessage} 
              disabled={!newMessage.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg p-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

interface MessageBubbleProps {
  message: UniversalMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-2 max-w-[85%] mb-3",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar visible seulement pour les messages reçus */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 ring-2 ring-border/20">
          <AvatarImage src={message.sender?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs font-semibold">
            {message.sender?.display_name?.charAt(0) || 'V'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bulle message avec glassmorphism */}
      <div className={cn(
        "rounded-2xl px-4 py-2.5 max-w-full shadow-md",
        isOwnMessage 
          ? "bg-gradient-to-br from-primary to-primary/90 text-white rounded-tr-sm" 
          : "bg-white dark:bg-zinc-800 text-foreground border border-border/50 rounded-tl-sm backdrop-blur-sm"
      )}>
        {message.message_type === 'location' ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">📍 Position partagée</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
        <p className={cn(
          "text-xs mt-1 flex items-center gap-1",
          isOwnMessage ? "text-white/70 justify-end" : "text-muted-foreground"
        )}>
          {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {isOwnMessage && <span>✓</span>}
        </p>
      </div>
    </motion.div>
  );
};