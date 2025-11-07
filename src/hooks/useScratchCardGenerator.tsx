import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useScratchCardGenerator = () => {
  const { user } = useAuth();

  const generateTestCard = async (rarityOverride?: 'common' | 'rare' | 'epic' | 'legendary') => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: {
          action: 'generate_scratch_card',
          userId: user.id,
          rarity: rarityOverride // Optionnel : forcer une rareté
        }
      });

      if (error) {
        console.error('Erreur génération carte:', error);
        toast.error('Erreur lors de la génération');
        return null;
      }

      toast.success('🎰 Nouvelle carte à gratter disponible !', {
        description: 'Rendez-vous dans la section Tombola'
      });

      return data?.scratchCard;
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération');
      return null;
    }
  };

  const generateMultipleCards = async (count: number = 5) => {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const card = await generateTestCard();
      if (card) cards.push(card);
      // Délai pour éviter spam
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return cards;
  };

  return {
    generateTestCard,
    generateMultipleCards
  };
};
