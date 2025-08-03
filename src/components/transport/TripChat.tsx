import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Send, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock 
} from 'lucide-react';

interface TripMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: 'client' | 'driver';
  message_type: 'text' | 'location' | 'system';
  content: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

interface TripChatProps {
  bookingId: string;
  driverInfo?: {
    name: string;
    phone: string;
    rating: number;
    vehicle: string;
  };
  userType: 'client' | 'driver';
  onClose?: () => void;
}

const TripChat: React.FC<TripChatProps> = ({
  bookingId,
  driverInfo,
  userType,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages((data || []) as TripMessage[]);
      
      // Mark messages as read
      await markMessagesAsRead();
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`trip-chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const newMessage = payload.new as TripMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // Show notification if message is from other user
          if (newMessage.sender_id !== user?.id) {
            if (newMessage.message_type === 'text') {
              toast.info(`Nouveau message: ${newMessage.content}`);
            } else if (newMessage.message_type === 'system') {
              toast.info(newMessage.content);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('trip_messages')
        .update({ is_read: true })
        .eq('booking_id', bookingId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (content: string, messageType: 'text' | 'location' | 'system' = 'text') => {
    if (!user || !content.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('trip_messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          sender_type: userType,
          message_type: messageType,
          content: content.trim(),
          metadata: {}
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const sendLocationMessage = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationMessage = `📍 Ma position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          await sendMessage(locationMessage, 'location');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Impossible d\'obtenir votre position');
        }
      );
    } else {
      toast.error('Géolocalisation non supportée');
    }
  };

  const handleCall = () => {
    if (driverInfo?.phone) {
      window.open(`tel:${driverInfo.phone}`, '_self');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStyle = (message: TripMessage) => {
    const isOwnMessage = message.sender_id === user?.id;
    
    if (message.message_type === 'system') {
      return 'bg-muted text-muted-foreground text-center italic text-sm py-2';
    }
    
    return isOwnMessage
      ? 'bg-primary text-primary-foreground ml-auto max-w-[80%] rounded-lg px-3 py-2'
      : 'bg-muted text-foreground mr-auto max-w-[80%] rounded-lg px-3 py-2';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <MessageSquare className="w-5 h-5 mr-2" />
            Chat de course
          </CardTitle>
          <div className="flex items-center space-x-2">
            {driverInfo && userType === 'client' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCall}
                className="flex items-center"
              >
                <Phone className="w-4 h-4 mr-1" />
                Appeler
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                ✕
              </Button>
            )}
          </div>
        </div>
        
        {driverInfo && userType === 'client' && (
          <div className="text-sm text-muted-foreground">
            {driverInfo.name} • {driverInfo.vehicle} • ⭐ {driverInfo.rating}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
          {loading ? (
            <div className="text-center text-muted-foreground">
              Chargement des messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Aucun message pour le moment
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={getMessageStyle(message)}
              >
                <div className="mb-1">
                  {message.message_type === 'location' && (
                    <MapPin className="w-4 h-4 inline mr-1" />
                  )}
                  {message.content}
                </div>
                <div className="text-xs opacity-70 flex items-center justify-end">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(message.created_at)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={sendLocationMessage}
            disabled={sending}
            className="shrink-0"
          >
            <MapPin className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(newMessage);
                }
              }}
              disabled={sending}
            />
            <Button
              onClick={() => sendMessage(newMessage)}
              disabled={sending || !newMessage.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Messages */}
        <div className="mt-3 flex flex-wrap gap-2">
          {userType === 'client' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('Je suis en route')}
                disabled={sending}
                className="text-xs"
              >
                En route
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('Je vous attends')}
                disabled={sending}
                className="text-xs"
              >
                J'attends
              </Button>
            </>
          )}
          
          {userType === 'driver' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('J\'arrive dans 5 minutes')}
                disabled={sending}
                className="text-xs"
              >
                5 min
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage('Je suis arrivé')}
                disabled={sending}
                className="text-xs"
              >
                Arrivé
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripChat;