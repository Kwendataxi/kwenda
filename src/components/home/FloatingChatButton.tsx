import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';

export const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { conversations } = useUniversalChat();

  const totalUnreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

  if (isOpen) {
    return (
      <UniversalChatInterface
        isFloating={true}
        onClose={() => setIsOpen(false)}
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};