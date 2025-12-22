import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  MapPin, 
  X,
  ArrowLeft,
  Check,
  CheckCheck,
  AlertCircle,
  Loader2,
  Reply as ReplyIcon
} from 'lucide-react';
import { useUniversalChat, type UniversalConversation, type UniversalMessage } from '@/hooks/useUniversalChat';
import { useChatPresence } from '@/hooks/useChatPresence';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotificationService';
import { notificationSoundService } from '@/services/notificationSound';
import { OnlineStatusBadge } from './OnlineStatusBadge';
import { TypingBubble } from './TypingBubble';
import { MessageReply, MessageReplyPreview } from './MessageReply';
import { ImageAttachment, ImageMessage, ImagePreview, uploadChatImage } from './ImageAttachment';
import { NewMessagesButton } from './NewMessagesButton';
import { LastMessagePreview } from './LastMessagePreview';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const {
    conversations,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    sendLocationMessage,
    createOrFindConversation,
    loadMoreMessages,
    hasMore,
    loadingMore,
    retryMessage
  } = useUniversalChat();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [replyingTo, setReplyingTo] = useState<UniversalMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const otherParticipantId = currentConversation?.other_participant?.id;

  const { 
    isTyping: otherIsTyping, 
    isOnline: otherIsOnline,
    broadcastTyping 
  } = useChatPresence(selectedConversation || undefined, otherParticipantId || undefined);

  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const hasMoreMessages = selectedConversation ? hasMore[selectedConversation] || false : false;
  const isLoadingMore = selectedConversation ? loadingMore[selectedConversation] || false : false;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowNewMessagesButton(!isNearBottom && conversationMessages.length > 0);
    
    if (target.scrollTop < 50 && hasMoreMessages && !isLoadingMore && selectedConversation) {
      loadMoreMessages(selectedConversation);
    }
  }, [hasMoreMessages, isLoadingMore, selectedConversation, loadMoreMessages, conversationMessages.length]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setShowNewMessagesButton(false);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        scrollToBottom();
      } else {
        setShowNewMessagesButton(true);
      }
    }
  }, [conversationMessages, scrollToBottom]);

  useEffect(() => {
    if (!user) return;
    const notificationChannel = supabase
      .channel('chat-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'push_notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const notification = payload.new as any;
          if (notification.type === 'chat_message') {
            await notificationSoundService.playNotificationSound('message');
            await pushNotificationService.showNotification(notification.title, {
              body: notification.body, tag: notification.data?.conversation_id,
              data: { url: `/chat?conversation=${notification.data?.conversation_id}` }, requireInteraction: false
            });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(notificationChannel); };
  }, [user]);

  useEffect(() => {
    if (contextType && participantId && !selectedConversation) {
      const existingConv = conversations.find(conv => 
        conv.context_type === contextType && conv.context_id === contextId && conv.other_participant?.id === participantId
      );
      if (existingConv) {
        setSelectedConversation(existingConv.id);
        fetchMessages(existingConv.id);
      } else {
        createOrFindConversation(contextType, participantId, contextId, title)
          .then((conv) => { if (conv) { setSelectedConversation(conv.id); fetchMessages(conv.id); } });
      }
    }
  }, [contextType, participantId, contextId, title, conversations, selectedConversation]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  }, [broadcastTyping]);

  const handleImageSelect = useCallback((file: File | null) => {
    setSelectedImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  }, [imagePreviewUrl]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return;
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadChatImage(selectedImage, selectedConversation);
        } catch (error) {
          toast.error('Erreur lors de l\'envoi de l\'image');
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }
      const msgType = imageUrl ? 'image' : 'text';
      const metadata = imageUrl ? { image_url: imageUrl } : {};
      await sendMessage(selectedConversation, newMessage.trim() || (imageUrl ? '📷 Image' : ''), msgType, metadata, [], replyingTo?.id);
      setNewMessage('');
      setReplyingTo(null);
      handleImageSelect(null);
      scrollToBottom();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const handleSendLocation = async () => {
    if (!selectedConversation) return;
    try { await sendLocationMessage(selectedConversation); scrollToBottom(); } catch (error) { console.error('Error:', error); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleReply = useCallback((message: UniversalMessage) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  }, []);

  const handleRetry = useCallback((messageId: string) => {
    const msg = conversationMessages.find(m => m.id === messageId || m.tempId === messageId);
    if (msg?.tempId && selectedConversation) {
      retryMessage(selectedConversation, msg.tempId);
    }
  }, [conversationMessages, selectedConversation, retryMessage]);

  if (isFloating && isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsMinimized(false)} className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground shadow-lg">
          <MessageCircle className="h-6 w-6" />
          {conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0) > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive">
              {conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0)}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  const containerClass = isFloating
    ? "fixed inset-0 md:inset-auto md:bottom-4 md:right-4 w-full h-[100dvh] md:w-96 md:h-[520px] z-50 shadow-2xl rounded-none md:rounded-2xl border border-border/40 bg-background/95 backdrop-blur"
    : "w-full h-full";

  return (
    <Card className={cn("flex flex-col bg-background", containerClass)}>
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b bg-card/60 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedConversation(null); setReplyingTo(null); }} className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedConversation && currentConversation && (
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={currentConversation.other_participant?.shop_logo_url || currentConversation.other_participant?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                    {currentConversation.other_participant?.shop_name?.[0] || currentConversation.other_participant?.display_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>
                <OnlineStatusBadge isOnline={otherIsOnline} className="absolute -bottom-0.5 -right-0.5" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">
                {selectedConversation ? (currentConversation?.context_type === 'marketplace' && currentConversation.other_participant?.shop_name
                  ? `🛍️ ${currentConversation.other_participant.shop_name}`
                  : currentConversation?.other_participant?.display_name || 'Chat') : 'Messages'}
              </h3>
              {selectedConversation && (
                <p className="text-xs text-muted-foreground">{otherIsOnline ? <span className="text-green-500">En ligne</span> : <span>Hors ligne</span>}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFloating && <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} className="p-1"><MessageCircle className="h-4 w-4" /></Button>}
            {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="p-1"><X className="h-4 w-4" /></Button>}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 relative">
        {!selectedConversation ? (
          <ConversationsList conversations={conversations} onSelectConversation={(id) => { setSelectedConversation(id); fetchMessages(id); }} loading={loading} />
        ) : (
          <>
            <div ref={scrollAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 bg-background">
              {isLoadingMore && <div className="flex justify-center py-2"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
              {hasMoreMessages && !isLoadingMore && <div className="text-center py-2"><span className="text-xs text-muted-foreground">↑ Défiler pour charger plus</span></div>}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {conversationMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} onReply={handleReply} onRetry={handleRetry} allMessages={conversationMessages} onImagePreview={setPreviewImage} />
                  ))}
                </AnimatePresence>
                <AnimatePresence>{otherIsTyping && <TypingBubble />}</AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {quickActions.length > 0 && (
              <div className="px-3 py-2 border-t bg-gradient-to-r from-muted/30 to-muted/10">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickActions.map((action, index) => (
                    <motion.button key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={action.action}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20">
                      {action.icon && <action.icon className="h-3.5 w-3.5" />}{action.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>{replyingTo && <MessageReply message={replyingTo} onCancel={() => setReplyingTo(null)} />}</AnimatePresence>
            <AnimatePresence>
              {imagePreviewUrl && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-3 py-2 border-t bg-muted/30">
                  <div className="relative inline-block">
                    <img src={imagePreviewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => handleImageSelect(null)}><X className="h-3 w-3" /></Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3 border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2">
                <ImageAttachment onImageSelect={handleImageSelect} disabled={uploadingImage} />
                <Button 
                  onClick={handleSendLocation} 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 flex-shrink-0 transition-colors"
                >
                  <MapPin className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input 
                    ref={inputRef} 
                    value={newMessage} 
                    onChange={handleInputChange} 
                    onKeyPress={handleKeyPress} 
                    placeholder="Votre message..." 
                    className="h-11 rounded-full border border-border bg-card shadow-sm focus:bg-card focus:border-primary/60 focus:ring-2 focus:ring-primary/10 pr-12 text-sm placeholder:text-muted-foreground/70 transition-all" 
                    disabled={uploadingImage} 
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={(!newMessage.trim() && !selectedImage) || uploadingImage} 
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 transition-all"
                  >
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        <AnimatePresence>{showNewMessagesButton && selectedConversation && <NewMessagesButton onClick={() => scrollToBottom()} count={0} />}</AnimatePresence>
      </div>
      <AnimatePresence>{previewImage && <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}</AnimatePresence>
    </Card>
  );
};

const ConversationsList = ({ conversations, onSelectConversation, loading }: { conversations: UniversalConversation[]; onSelectConversation: (id: string) => void; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
          className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full" 
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/15 to-orange-100 dark:to-primary/10 flex items-center justify-center shadow-sm border border-primary/10">
              <MessageCircle className="h-12 w-12 text-primary" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card flex items-center justify-center border-2 border-background shadow-sm"
            >
              <span className="text-sm">💬</span>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-6"
        >
          <h3 className="text-xl font-semibold text-foreground">Aucune conversation</h3>
          <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
            Négociez directement avec les vendeurs pour obtenir les meilleurs prix
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={() => window.location.href = '/marketplace'} 
            className="rounded-full px-6 shadow-md hover:shadow-lg transition-shadow"
          >
            Parcourir les produits
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 bg-background">
      <div className="p-3 space-y-2">
        {conversations.map((conversation, index) => (
          <motion.div 
            key={conversation.id} 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectConversation(conversation.id)} 
            className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/60 cursor-pointer transition-all active:scale-[0.98] group border border-border/40 hover:border-border/60 shadow-sm hover:shadow"
          >
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                <AvatarImage src={conversation.other_participant?.shop_logo_url || conversation.other_participant?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-medium">
                  {conversation.other_participant?.shop_name?.[0] || conversation.other_participant?.display_name?.charAt(0) || 'V'}
                </AvatarFallback>
              </Avatar>
              <OnlineStatusBadge isOnline={false} className="absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-foreground truncate text-sm">
                  {conversation.other_participant?.shop_name || conversation.other_participant?.display_name || 'Vendeur'}
                </p>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {conversation.last_message_at && new Date(conversation.last_message_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <LastMessagePreview message={conversation.last_message} isRead={!conversation.unread_count} />
                </div>
                {conversation.unread_count && conversation.unread_count > 0 && (
                  <Badge className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-semibold shadow-sm">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
};

const MessageBubble = ({ message, onReply, onRetry, allMessages, onImagePreview }: { message: UniversalMessage; onReply: (m: UniversalMessage) => void; onRetry: (id: string) => void; allMessages: UniversalMessage[]; onImagePreview: (url: string) => void }) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;
  const replyToMessage = message.reply_to_id ? allMessages.find(m => m.id === message.reply_to_id) : null;

  const getStatusIcon = () => {
    if (!isOwnMessage) return null;
    switch (message.status) {
      case 'sending': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'error': return <button onClick={() => onRetry(message.id)} className="flex items-center gap-1 text-destructive hover:underline"><AlertCircle className="h-3 w-3" /><span className="text-[10px]">Réessayer</span></button>;
      case 'read': return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default: return <Check className="h-3 w-3" />;
    }
  };

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -8 }} 
      transition={{ duration: 0.15 }} 
      className={cn("flex gap-2 max-w-[80%] group", isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto")}
    >
      {!isOwnMessage && (
        <Avatar className="h-7 w-7 flex-shrink-0 shadow-sm">
          <AvatarImage src={message.sender?.avatar_url} />
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            {message.sender?.display_name?.charAt(0) || 'V'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {!isOwnMessage && (
          <span className="text-[11px] text-muted-foreground font-medium px-1 mb-0.5">
            {(message.sender as any)?.shop_name || message.sender?.display_name || 'Vendeur'}
          </span>
        )}
        {replyToMessage && <MessageReplyPreview replyTo={replyToMessage} isOwnMessage={isOwnMessage} />}
        <div 
          className={cn(
            "rounded-2xl px-3.5 py-2 max-w-full relative",
            isOwnMessage 
              ? "bg-primary text-primary-foreground rounded-br-md" 
              : "bg-muted text-foreground rounded-bl-md",
            message.status === 'error' && "opacity-70"
          )}
        >
          {message.metadata?.image_url && (
            <ImageMessage 
              imageUrl={message.metadata.image_url} 
              onClick={() => onImagePreview(message.metadata?.image_url || '')} 
            />
          )}
          {message.message_type === 'location' ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">📍 Position partagée</span>
            </div>
          ) : message.content && message.content !== '📷 Image' && (
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          )}
          <div className={cn(
            "text-[10px] mt-1 flex items-center gap-1",
            isOwnMessage ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"
          )}>
            {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {getStatusIcon()}
          </div>
          <button 
            onClick={() => onReply(message)} 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-1 rounded-full bg-background shadow-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity",
              isOwnMessage ? "-left-7" : "-right-7"
            )}
          >
            <ReplyIcon className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

