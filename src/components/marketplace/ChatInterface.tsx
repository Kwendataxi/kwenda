import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Package } from 'lucide-react';
import { TypingIndicator } from '@/components/marketplace/TypingIndicator';
import { QuickReplies } from '@/components/marketplace/QuickReplies';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatInterfaceProps {
  conversationId?: string;
  onBack?: () => void;
  onStartOrder?: (productId: string, sellerId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onBack,
  onStartOrder
}) => {
  const { t } = useLanguage();
  const { conversations, messages, sendMessage, fetchMessages } = useMarketplaceChat();
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(conversationId);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

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

  if (!conversationId && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('marketplace.noConversations')}
        </h3>
        <p className="text-muted-foreground">
          {t('marketplace.startChatting')}
        </p>
      </div>
    );
  }

  // Conversations list view
  if (!selectedConversation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {t('marketplace.messages')}
          </h2>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
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
                    <h3 className="font-semibold text-foreground truncate">
                      {conversation.other_participant?.display_name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistance(new Date(conversation.last_message_at), new Date(), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {conversation.product?.title}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                      {conversation.product?.price?.toLocaleString()} FC
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {conversation.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(undefined)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-10 w-10">
          {currentConversation?.other_participant?.avatar_url ? (
            <img
              src={currentConversation.other_participant.avatar_url}
              alt={currentConversation.other_participant.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
              {currentConversation?.other_participant?.display_name?.[0]?.toUpperCase()}
            </div>
          )}
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            {currentConversation?.other_participant?.display_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentConversation?.product?.title}
          </p>
        </div>

        {currentConversation && onStartOrder && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStartOrder(
              currentConversation.product_id,
              currentConversation.seller_id
            )}
          >
            <Package className="h-4 w-4 mr-2" />
            {t('marketplace.order')}
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {currentMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex ${message.sender_id === currentConversation?.buyer_id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender_id === currentConversation?.buyer_id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {formatDistance(new Date(message.created_at), new Date(), {
                    addSuffix: true,
                    locale: fr
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <TypingIndicator sellerName={currentConversation?.other_participant?.display_name} />
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t bg-card space-y-2">
        {/* Quick Replies */}
        <QuickReplies onSelect={(msg) => setNewMessage(msg)} />
        
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('marketplace.typeMessage')}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};