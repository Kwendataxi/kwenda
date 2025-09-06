import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  MessageCircle, 
  User, 
  Truck,
  Phone,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'client' | 'driver' | 'system';
  message: string;
  sent_at: string;
  read_at?: string;
}

interface SimpleDeliveryChatProps {
  orderId: string;
  userType: 'client' | 'driver';
  userId: string;
  partnerName?: string;
  partnerPhone?: string;
  onCall?: () => void;
}

export default function SimpleDeliveryChat({
  orderId,
  userType,
  userId,
  partnerName,
  partnerPhone,
  onCall
}: SimpleDeliveryChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SimpleChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simuler des messages pour la démonstration
  useEffect(() => {
    const sampleMessages: SimpleChatMessage[] = [
      {
        id: '1',
        sender_id: userType === 'client' ? 'driver-id' : 'client-id',
        sender_type: userType === 'client' ? 'driver' : 'client',
        message: userType === 'client' 
          ? 'Bonjour, je suis en route pour récupérer votre colis'
          : 'Bonjour, combien de temps pour arriver ?',
        sent_at: new Date(Date.now() - 300000).toISOString(),
        read_at: new Date().toISOString()
      },
      {
        id: '2',
        sender_id: userId,
        sender_type: userType,
        message: userType === 'client' 
          ? 'Parfait, je vous attends'
          : 'J\'arrive dans 10 minutes',
        sent_at: new Date(Date.now() - 180000).toISOString(),
        read_at: new Date().toISOString()
      }
    ];
    setMessages(sampleMessages);
  }, [userId, userType]);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const message: SimpleChatMessage = {
        id: Date.now().toString(),
        sender_id: userId,
        sender_type: userType,
        message: newMessage.trim(),
        sent_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick message templates
  const quickMessages = userType === 'driver' 
    ? [
        "Je suis en route pour récupérer votre colis",
        "Colis récupéré, en route vers la destination",
        "Je suis arrivé à destination",
        "Où puis-je vous trouver ?",
        "Livraison terminée"
      ]
    : [
        "Où êtes-vous maintenant ?",
        "Combien de temps encore ?",
        "Je vous attends à l'entrée",
        "Merci pour votre service !",
        "Pouvez-vous m'appeler ?"
      ];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleQuickMessage = (message: string) => {
    setNewMessage(message);
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat livraison
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {partnerName && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {userType === 'client' ? (
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{partnerName}</span>
                </div>
                
                {onCall && partnerPhone && (
                  <Button size="sm" variant="outline" onClick={onCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            <Badge 
              variant={isOnline ? "default" : "secondary"}
              className="text-xs"
            >
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${
                    message.sender_id === userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`
                    max-w-[80%] rounded-lg px-3 py-2 text-sm
                    ${message.sender_id === userId 
                      ? 'bg-primary text-primary-foreground' 
                      : message.sender_type === 'system'
                      ? 'bg-muted text-muted-foreground italic'
                      : 'bg-muted'
                    }
                  `}>
                    <p>{message.message}</p>
                    <div className={`
                      text-xs mt-1 flex items-center gap-1
                      ${message.sender_id === userId 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                      }
                    `}>
                      <Clock className="h-3 w-3" />
                      {formatTime(message.sent_at)}
                      {message.read_at && message.sender_id === userId && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Quick messages */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {quickMessages.slice(0, 3).map((msg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleQuickMessage(msg)}
              >
                {msg.length > 20 ? msg.slice(0, 20) + '...' : msg}
              </Button>
            ))}
          </div>
        </div>

        {/* Message input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}