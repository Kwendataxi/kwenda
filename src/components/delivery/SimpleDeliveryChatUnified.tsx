import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { Package, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleDeliveryChatUnifiedProps {
  orderId: string;
  userType: 'client' | 'driver';
  userId: string;
  partnerName?: string;
  partnerPhone?: string;
  onCall?: () => void;
}

const SimpleDeliveryChatUnified: React.FC<SimpleDeliveryChatUnifiedProps> = ({
  orderId,
  userType,
  userId,
  partnerName = 'Livreur',
  partnerPhone,
  onCall
}) => {
  const handleCall = () => {
    if (onCall) {
      onCall();
    } else if (partnerPhone) {
      window.location.href = `tel:${partnerPhone}`;
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };

  return (
    <UniversalChatInterface
      contextType="delivery"
      contextId={orderId}
      title={`Livraison avec ${partnerName}`}
      isFloating={false}
      quickActions={
        userType === 'driver'
          ? [
              { 
                label: "Colis récupéré", 
                action: () => {},
                icon: Package
              },
              { 
                label: "En route vers vous", 
                action: () => {} 
              },
              { 
                label: "J'arrive dans 5 min", 
                action: () => {} 
              }
            ]
          : [
              { 
                label: "Où êtes-vous ?", 
                action: () => {},
                icon: MapPin
              },
              { 
                label: "Je vous attends", 
                action: () => {} 
              },
              { 
                label: "Appeler", 
                action: handleCall,
                icon: Phone
              }
            ]
      }
    />
  );
};

export default SimpleDeliveryChatUnified;
