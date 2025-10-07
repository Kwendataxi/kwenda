import React, { useState } from 'react';
import { ModernChatInterface } from './ModernChatInterface';
import { MessageCircle } from 'lucide-react';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const FloatingChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { conversations, messages } = useMarketplaceChat();

  // Calculate total unread messages
  const totalUnread = conversations.reduce((total, conv) => {
    const convMessages = messages[conv.id] || [];
    return total + convMessages.filter(msg => !msg.is_read).length;
  }, 0);

  return (
    <>
      {isOpen && (
        <ModernChatInterface
          isFloating={true}
          onClose={() => setIsOpen(false)}
        />
      )}
      {!isOpen && (
        <div className="fixed bottom-6 right-4 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "group relative h-12 w-12 rounded-full",
              "bg-card/80 backdrop-blur-xl border border-border/50",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300 hover:scale-105",
              "flex items-center justify-center"
            )}
            aria-label="Ouvrir le chat marketplace"
          >
            <MessageCircle className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
            
            {/* Subtle unread indicator - Red dot instead of badge */}
            {totalUnread > 0 && (
              <div className="absolute -top-0.5 -right-0.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
              </div>
            )}
          </button>
        </div>
      )}
    </>
  );
};