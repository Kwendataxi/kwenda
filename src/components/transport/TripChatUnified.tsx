import React from 'react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';
import { MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface TripChatUnifiedProps {
  bookingId: string;
  driverName?: string;
  driverPhone?: string;
  userType: 'client' | 'driver';
  onClose?: () => void;
  className?: string;
}

export const TripChatUnified: React.FC<TripChatUnifiedProps> = ({
  bookingId,
  driverName = 'Chauffeur',
  driverPhone,
  userType,
  onClose,
  className = ''
}) => {
  const handleCall = () => {
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  };

  return (
    <div className={className}>
      <UniversalChatInterface
        contextType="transport"
        contextId={bookingId}
        title={`Course avec ${driverName}`}
        onClose={onClose}
        isFloating={false}
        quickActions={
          userType === 'client'
            ? [
                { 
                  label: "Où êtes-vous ?", 
                  action: () => {},
                  icon: MapPin
                },
                { 
                  label: "J'arrive dans 5 min", 
                  action: () => {} 
                },
                { 
                  label: "Appeler", 
                  action: handleCall,
                  icon: Phone
                }
              ]
            : [
                { 
                  label: "J'arrive", 
                  action: () => {} 
                },
                { 
                  label: "Je suis là", 
                  action: () => {} 
                },
                { 
                  label: "Problème de circulation", 
                  action: () => {} 
                }
              ]
        }
      />
    </div>
  );
};
