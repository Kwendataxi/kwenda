import { useState, useEffect, useRef } from 'react';
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

interface UniversalChatInterfaceProps {
  isFloating?: boolean;
  onClose?: () => void;
  contextType?: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
  contextId?: string;
  participantId?: string;
  title?: string;
  quickActions?: { label: string; action: () => void; icon?: any }[];
}

export const UniversalChatInterface = ({
  isFloating = false,
  onClose,
  contextType,
  contextId,
  participantId,
  title,
  quickActions = []
}: UniversalChatInterfaceProps) => {
  const { language } = useLanguage();
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

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="assistant">Assistant IA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
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
          </TabsContent>
          
          <TabsContent value="assistant" className="flex-1 p-2 m-0">
            <AIAssistantWidget 
              context={contextType as any}
              className="h-full border-0 shadow-none"
            />
          </TabsContent>
        </Tabs>
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

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="px-4 py-2 border-t">
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="text-xs"
              >
                {action.icon && <action.icon className="h-3 w-3 mr-1" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t space-y-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Tapez votre message..."
            className="flex-1"
          />
          <Button onClick={onSendLocation} variant="outline" size="icon">
            <MapPin className="h-4 w-4" />
          </Button>
          <Button onClick={onSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

interface MessageBubbleProps {
  message: UniversalMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  // Get current user from auth context  
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;

  return (
    <div className={cn(
      "flex gap-2 max-w-[80%]",
      isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender?.avatar_url} />
        <AvatarFallback>
          {message.sender?.display_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "rounded-lg p-3 max-w-full",
        isOwnMessage 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground"
      )}>
        {message.message_type === 'location' ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Position partagée</span>
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};