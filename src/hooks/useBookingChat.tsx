import { useUniversalChat } from './useUniversalChat';
import { useChat } from '@/components/chat/ChatProvider';

/**
 * Hook helper pour ouvrir facilement le chat depuis un booking
 */
export const useBookingChat = () => {
  const { createConversationFromBooking } = useUniversalChat();
  const { openChat } = useChat();

  const openChatFromBooking = async (
    bookingId: string,
    bookingType: 'transport' | 'delivery',
    participantName?: string
  ) => {
    try {
      // Créer ou récupérer la conversation
      const conversation = await createConversationFromBooking(bookingId, bookingType);
      
      if (!conversation) {
        console.error('Failed to create/find conversation');
        return;
      }

      // Déterminer l'autre participant
      const participantId = conversation.participant_1 === conversation.participant_2 
        ? conversation.participant_1 
        : conversation.participant_1;

      // Ouvrir le chat avec le contexte approprié
      openChat({
        contextType: bookingType,
        contextId: bookingId,
        participantId,
        title: participantName 
          ? `${bookingType === 'transport' ? 'Course' : 'Livraison'} avec ${participantName}`
          : `${bookingType === 'transport' ? 'Course' : 'Livraison'} #${bookingId.slice(0, 8)}`,
        quickActions: bookingType === 'transport' 
          ? [
              { label: "J'arrive dans 5 min", action: () => {} },
              { label: "Où êtes-vous ?", action: () => {} },
              { label: "Merci !", action: () => {} }
            ]
          : [
              { label: "Colis récupéré", action: () => {} },
              { label: "En route", action: () => {} },
              { label: "Livraison terminée", action: () => {} }
            ]
      });
    } catch (error) {
      console.error('Error opening chat from booking:', error);
    }
  };

  return { openChatFromBooking };
};
