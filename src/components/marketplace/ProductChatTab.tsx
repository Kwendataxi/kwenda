import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { Package, DollarSign, MapPin } from 'lucide-react';

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
  return (
    <div className="h-full overflow-hidden">
      <UniversalChatInterface
        contextType="marketplace"
        contextId={productId}
        participantId={sellerId}
        title={`Chat - ${productTitle}`}
        isFloating={false}
        hideHeader={true}
        quickActions={[
          { 
            label: "📦 Disponible ?", 
            action: () => {},
            icon: Package
          },
          { 
            label: "💰 Prix négociable ?", 
            action: () => {},
            icon: DollarSign
          },
          { 
            label: "📍 Lieu de retrait ?", 
            action: () => {},
            icon: MapPin
          }
        ]}
      />
    </div>
  );
};
