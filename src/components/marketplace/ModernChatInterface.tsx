import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Send, 
  X, 
  ArrowLeft, 
  Minimize2,
  MoreVertical,
  Phone,
  MapPin
} from 'lucide-react';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ModernChatInterfaceProps {
  productId?: string;
  sellerId?: string;
  isFloating?: boolean;
  isCompact?: boolean;
  onClose?: () => void;
}

export const ModernChatInterface: React.FC<ModernChatInterfaceProps> = ({
  productId,
  sellerId,
  isFloating = false,
  isCompact = false,
  onClose
}) => {
  const { t } = useLanguage();
  const { conversations, messages, sendMessage, fetchMessages, startConversation } = useMarketplaceChat();
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>();
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate unread messages
  useEffect(() => {
    const totalUnread = conversations.reduce((total, conv) => {
      const convMessages = messages[conv.id] || [];
      return total + convMessages.filter(msg => !msg.is_read && msg.sender_id !== conv.buyer_id).length;
    }, 0);
    setUnreadCount(totalUnread);
  }, [conversations, messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages[selectedConversation || ''], isMinimized]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    await sendMessage(selectedConversation, newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartConversation = async () => {
    if (productId && sellerId) {
      const conversationId = await startConversation(productId, sellerId);
      if (conversationId) {
        setSelectedConversation(conversationId);
      }
    }
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  // Quick message templates
  const quickMessages = [
    "Bonjour! Je suis intéressé(e) par ce produit.",
    "Le produit est-il toujours disponible?",
    "Quel est votre meilleur prix?",
    "Pouvons-nous nous rencontrer?",
  ];

  if (isFloating) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        {isMinimized ? (
          <Button
            onClick={() => setIsMinimized(false)}
            className="relative bg-card/80 backdrop-blur-xl border border-border/50 text-foreground shadow-lg hover:shadow-xl rounded-full w-12 h-12 transition-all hover:scale-105"
            size="icon"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
            {unreadCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
              </div>
            )}
          </Button>
        ) : (
          <Card className={cn(
            "bg-card shadow-2xl border border-border/50 overflow-hidden backdrop-blur-xl",
            isCompact ? "w-80 md:w-96 h-96" : "w-80 h-[32rem]"
          )}>
            {/* Floating chat header - Compact */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium text-sm text-foreground truncate">
                  {selectedConversation ? currentConversation?.other_participant?.display_name : 'Messages'}
                </span>
                {unreadCount > 0 && !selectedConversation && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs flex-shrink-0">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsMinimized(true)}
                  className="h-7 w-7 p-0"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                {onClose && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Chat content */}
            <div className="flex flex-col h-full">
              {!selectedConversation ? (
                <ConversationsList 
                  conversations={conversations}
                  onSelectConversation={setSelectedConversation}
                  onStartConversation={handleStartConversation}
                  productId={productId}
                  sellerId={sellerId}
                />
              ) : (
                <ChatView
                  conversation={currentConversation}
                  messages={currentMessages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  onSendMessage={handleSendMessage}
                  onKeyPress={handleKeyPress}
                  onBack={() => setSelectedConversation(undefined)}
                  quickMessages={quickMessages}
                  messagesEndRef={messagesEndRef}
                />
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Full-screen chat interface
  return (
    <div className="h-full flex flex-col">
      {!selectedConversation ? (
        <ConversationsList 
          conversations={conversations}
          onSelectConversation={setSelectedConversation}
          onStartConversation={handleStartConversation}
          productId={productId}
          sellerId={sellerId}
        />
      ) : (
        <ChatView
          conversation={currentConversation}
          messages={currentMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          onBack={() => setSelectedConversation(undefined)}
          quickMessages={quickMessages}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
};

// Conversations list component
const ConversationsList: React.FC<{
  conversations: any[];
  onSelectConversation: (id: string) => void;
  onStartConversation: () => void;
  productId?: string;
  sellerId?: string;
}> = ({ conversations, onSelectConversation, onStartConversation, productId, sellerId }) => {
  const { t } = useLanguage();

  if (conversations.length === 0 && productId && sellerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Commencer une conversation
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Contactez le vendeur pour obtenir plus d'informations sur ce produit.
        </p>
        <Button onClick={onStartConversation}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Contacter le vendeur
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-2 p-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className="p-3 cursor-pointer hover:bg-accent transition-colors border-l-4 border-l-primary/20 hover:border-l-primary"
          onClick={() => onSelectConversation(conversation.id)}
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
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm">
                  {conversation.other_participant?.display_name?.[0]?.toUpperCase()}
                </div>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {conversation.other_participant?.display_name}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {formatDistance(new Date(conversation.last_message_at), new Date(), {
                    addSuffix: true,
                    locale: fr
                  })}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground truncate mb-1">
                {conversation.product?.title}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">
                  {conversation.product?.price?.toLocaleString()} FC
                </span>
                <Badge variant="outline" className="text-xs">
                  {conversation.status}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Chat view component
const ChatView: React.FC<{
  conversation: any;
  messages: any[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onBack: () => void;
  quickMessages: string[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}> = ({ 
  conversation, 
  messages, 
  newMessage, 
  setNewMessage, 
  onSendMessage, 
  onKeyPress, 
  onBack, 
  quickMessages,
  messagesEndRef 
}) => {
  const [showQuickMessages, setShowQuickMessages] = useState(false);

  return (
    <>
      {/* Chat header */}
      <div className="flex items-center gap-3 p-3 border-b bg-card">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-8 w-8">
          {conversation?.other_participant?.avatar_url ? (
            <img
              src={conversation.other_participant.avatar_url}
              alt={conversation.other_participant.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-xs">
              {conversation?.other_participant?.display_name?.[0]?.toUpperCase()}
            </div>
          )}
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground truncate">
            {conversation?.other_participant?.display_name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {conversation?.product?.title}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MapPin className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === conversation?.buyer_id;
          const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {!isOwnMessage && showAvatar && (
                <Avatar className="h-6 w-6">
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-xs">
                    {conversation?.other_participant?.display_name?.[0]?.toUpperCase()}
                  </div>
                </Avatar>
              )}
              {!isOwnMessage && !showAvatar && <div className="w-6" />}
              
              <div
                className={`max-w-[75%] p-2 rounded-lg text-sm ${
                  isOwnMessage
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p>{message.content}</p>
                <span className={`text-xs mt-1 block ${
                  isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatDistance(new Date(message.created_at), new Date(), {
                    addSuffix: true,
                    locale: fr
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick messages */}
      {showQuickMessages && (
        <div className="p-2 border-t bg-muted/50">
          <div className="grid grid-cols-2 gap-1">
            {quickMessages.map((msg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-8 justify-start"
                onClick={() => {
                  setNewMessage(msg);
                  setShowQuickMessages(false);
                }}
              >
                {msg}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-3 border-t bg-card">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickMessages(!showQuickMessages)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Tapez votre message..."
            className="flex-1"
          />
          <Button onClick={onSendMessage} disabled={!newMessage.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};