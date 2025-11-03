import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { MessageCircle, Package, Phone, X, Tag, MapPin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductChatTabProps {
  productId: string;
  sellerId: string;
  productTitle: string;
  sellerName?: string;
  sellerAvatar?: string;
  onClose?: () => void;
}

export const ProductChatTab: React.FC<ProductChatTabProps> = ({
  productId,
  sellerId,
  productTitle,
  sellerName = 'Vendeur',
  sellerAvatar,
  onClose
}) => {
  const { 
    sendMessage,
    startConversation,
    conversations
  } = useMarketplaceChat();

  const [conversationId, setConversationId] = useState<string | undefined>();

  // Créer ou récupérer la conversation automatiquement
  useEffect(() => {
    const initConversation = async () => {
      try {
        const convId = await startConversation(productId, sellerId);
        setConversationId(convId);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la conversation:', error);
      }
    };
    
    initConversation();
  }, [productId, sellerId]);

  const sendQuickMessage = async (message: string) => {
    if (conversationId) {
      await sendMessage(conversationId, message);
      toast.success('Message envoyé');
    } else {
      toast.error('Conversation non initialisée');
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <UniversalChatInterface
          contextType="marketplace"
          contextId={conversationId}
          participantId={sellerId}
          title={`Chat - ${productTitle}`}
          isFloating={false}
          hideHeader={true}
          quickActions={[
            { 
              label: "Bonjour! 👋", 
              action: () => sendQuickMessage("Bonjour! Je suis intéressé(e) par ce produit."),
              icon: MessageCircle
            },
            { 
              label: "Disponibilité?", 
              action: () => sendQuickMessage("Le produit est-il toujours disponible?"),
              icon: Package
            },
            { 
              label: "Meilleur prix?", 
              action: () => sendQuickMessage("Quel est votre meilleur prix?"),
              icon: Tag
            },
            { 
              label: "Rencontre", 
              action: () => sendQuickMessage("Pouvons-nous nous rencontrer?"),
              icon: MapPin
            }
          ]}
        />
    </div>
  );
};
