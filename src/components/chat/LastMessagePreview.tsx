import React from 'react';
import { MapPin, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface LastMessagePreviewProps {
  message?: {
    content: string;
    message_type: 'text' | 'location' | 'image' | 'file' | 'quick_action';
    sender_id: string;
    is_read: boolean;
  };
  messageType?: string;
  isRead?: boolean;
  className?: string;
}

export const LastMessagePreview: React.FC<LastMessagePreviewProps> = ({
  message,
  isRead = false,
  className
}) => {
  const { user } = useAuth();
  
  if (!message) {
    return (
      <p className={cn("text-xs text-muted-foreground italic", className)}>
        Pas de message
      </p>
    );
  }

  const isOwnMessage = message.sender_id === user?.id;
  const messageIsRead = message.is_read || isRead;

  const getPreviewContent = () => {
    switch (message.message_type) {
      case 'location':
        return (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            Position partagée
          </span>
        );
      case 'image':
        return (
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3 flex-shrink-0" />
            Photo
          </span>
        );
      case 'file':
        return (
          <span className="flex items-center gap-1">
            📎 Fichier
          </span>
        );
      default:
        return message.content.length > 35 ? message.content.substring(0, 35) + '...' : message.content;
    }
  };

  const ReadIndicator = isOwnMessage ? (
    messageIsRead ? (
      <CheckCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
    ) : (
      <Check className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    )
  ) : null;

  return (
    <div className={cn(
      "flex items-center gap-1 text-sm text-muted-foreground truncate",
      className
    )}>
      {ReadIndicator}
      <span className="truncate">{getPreviewContent()}</span>
    </div>
  );
};
