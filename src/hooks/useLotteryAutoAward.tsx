import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type EventType = 'ride' | 'delivery' | 'purchase' | 'referral' | 'rating' | 'daily_login';

interface AwardConfig {
  probability: number;
  description: string;
}

const EVENT_PROBABILITIES: Record<EventType, AwardConfig> = {
  ride: { probability: 0.15, description: 'course terminée' },
  delivery: { probability: 0.10, description: 'livraison effectuée' },
  purchase: { probability: 0.20, description: 'achat marketplace' },
  referral: { probability: 1.0, description: 'parrainage réussi' },
  rating: { probability: 0.25, description: 'avis 5 étoiles' },
  daily_login: { probability: 0.05, description: 'connexion quotidienne' }
};

export const useLotteryAutoAward = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const awardCardOnEvent = async (
    eventType: EventType,
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    if (!user) {
      console.warn('❌ Utilisateur non connecté');
      return false;
    }

    const config = EVENT_PROBABILITIES[eventType];
    if (!config) {
      console.error(`❌ Type d'événement inconnu: ${eventType}`);
      return false;
    }

    // Vérifier la probabilité
    const roll = Math.random();
    const shouldAward = roll < config.probability;
    
    console.log(`🎲 Roll tombola pour ${eventType}: ${(roll * 100).toFixed(1)}% / ${(config.probability * 100)}%`, 
      shouldAward ? '✅ Gagné!' : '❌ Perdu');

    if (!shouldAward) {
      return false;
    }

    // Appeler l'edge function pour générer la carte
    try {
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: {
          action: 'generate_scratch_card',
          userId: user.id,
          metadata: {
            source_event: eventType,
            ...metadata
          }
        }
      });

      if (error) {
        console.error('❌ Erreur génération carte:', error);
        return false;
      }

      // Créer une notification dans la DB
      await supabase.from('delivery_notifications').insert({
        user_id: user.id,
        title: '🎰 Nouvelle carte à gratter !',
        message: `Vous avez gagné une carte suite à votre ${config.description}`,
        notification_type: 'lottery_card',
        metadata: {
          scratch_card_id: data?.scratchCard?.id,
          rarity: data?.scratchCard?.rarity,
          event_type: eventType
        }
      });

      // Toast avec action
      toast.success('🎰 Carte à gratter gagnée !', {
        description: `Suite à votre ${config.description}`,
        duration: 6000,
        action: {
          label: 'Voir',
          onClick: () => navigate('/app?view=lottery')
        }
      });

      console.log('✅ Carte attribuée:', data?.scratchCard);
      return true;
    } catch (error) {
      console.error('❌ Erreur attribution carte:', error);
      return false;
    }
  };

  // Helpers spécifiques
  const awardForRide = async (rideId: string): Promise<boolean> => 
    await awardCardOnEvent('ride', { ride_id: rideId });

  const awardForDelivery = async (deliveryId: string): Promise<boolean> => 
    await awardCardOnEvent('delivery', { delivery_id: deliveryId });

  const awardForPurchase = async (orderId: string, amount: number): Promise<boolean> => 
    await awardCardOnEvent('purchase', { order_id: orderId, amount });

  const awardForReferral = async (referredUserId: string): Promise<boolean> => 
    await awardCardOnEvent('referral', { referred_user_id: referredUserId });

  const awardForRating = async (ratingId: string, stars: number): Promise<boolean> => {
    if (stars === 5) {
      return await awardCardOnEvent('rating', { rating_id: ratingId, stars });
    }
    return false;
  };

  const awardForDailyLogin = async (): Promise<boolean> => {
    if (!user) return false;
    
    // Vérifier qu'on n'a pas déjà attribué aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingCard, error } = await supabase
      .from('lottery_wins')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erreur vérification carte quotidienne:', error);
      return false;
    }

    if (existingCard) {
      console.log('ℹ️ Carte quotidienne déjà attribuée');
      return false;
    }

    return await awardCardOnEvent('daily_login');
  };

  return {
    awardCardOnEvent,
    awardForRide,
    awardForDelivery,
    awardForPurchase,
    awardForReferral,
    awardForRating,
    awardForDailyLogin,
    probabilities: EVENT_PROBABILITIES
  };
};
