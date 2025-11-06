import React, { useState } from 'react';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, ArrowLeft, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

export const MessagesTab: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    loading, 
    sendMessage, 
    fetchMessages 
  } = useMarketplaceChat();
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    await fetchMessages(conversationId);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      await sendMessage(selectedConversation, messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const productTitle = conv.product?.title || '';
    const otherUserName = conv.other_participant?.display_name || '';
    return (
      productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  // Vue détaillée d'une conversation
  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold">{conversation?.other_participant?.display_name}</h3>
            <p className="text-sm text-muted-foreground">{conversation?.product?.title}</p>
          </div>
          <Badge variant={conversation?.status === 'active' ? 'default' : 'secondary'}>
            {conversation?.status === 'active' ? 'Active' : 'Terminée'}
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {!messages[selectedConversation] || messages[selectedConversation].length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucun message pour le moment. Commencez la conversation !
              </div>
            ) : (
              messages[selectedConversation].map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                  className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Écrivez votre message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Liste des conversations
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 border-b">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Mes conversations</h2>
        <Badge variant="secondary" className="ml-auto">
          {conversations.length}
        </Badge>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="space-y-2 px-4">
        {filteredConversations.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Aucune conversation</h3>
              <p className="text-sm text-muted-foreground">
                Contactez un vendeur depuis la marketplace pour démarrer une conversation
              </p>
            </div>
          </Card>
        ) : (
          filteredConversations.map((conv) => (
            <motion.div
              key={conv.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectConversation(conv.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {conv.product?.images?.[0] ? (
                        <img 
                          src={conv.product.images[0]} 
                          alt={conv.product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <MessageCircle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium truncate">{conv.product?.title || 'Produit'}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.other_participant?.display_name || 'Utilisateur'}
                      </p>
                      {conv.last_message_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conv.last_message_at), 'dd MMM HH:mm', { locale: fr })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
