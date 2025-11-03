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
  const { sendMessage } = useMarketplaceChat();
  const [conversationId, setConversationId] = useState<string | undefined>();

  const sendQuickMessage = async (message: string) => {
    if (conversationId) {
      await sendMessage(conversationId, message);
      toast.success('Message envoyé');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header gradient moderne */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="shrink-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600 p-4 shadow-lg"
      >
        <div className="flex items-center gap-3">
          {/* Avatar vendeur */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <Avatar className="h-12 w-12 ring-2 ring-white/30">
              <AvatarImage src={sellerAvatar} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {sellerName?.[0] || 'V'}
              </AvatarFallback>
            </Avatar>
            {/* Indicateur en ligne */}
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-lg" />
          </motion.div>

          {/* Infos vendeur + produit */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {sellerName}
            </h3>
            <p className="text-xs text-white/80 truncate flex items-center gap-1">
              <Package className="h-3 w-3" />
              {productTitle}
            </p>
          </div>

          {/* Actions rapides */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={() => toast.info('Fonction appel à venir')}
            >
              <Phone className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Messages container - Full height, fond propre */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 min-h-0">
        <UniversalChatInterface
          contextType="marketplace"
          contextId={productId}
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
    </div>
  );
};
