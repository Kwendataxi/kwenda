import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface UserReward {
  id: string;
  title: string;
  description: string;
  reward_type: 'points' | 'discount' | 'free_delivery' | 'gift';
  reward_value: number;
  points_required?: number;
  is_claimed: boolean;
  expires_at?: string;
}

interface UserStats {
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  current_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  days_since_registration: number;
}

export const useRewards = () => {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserRewards = async () => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch user statistics from multiple tables
      const [ordersResult, walletResult, profileResult] = await Promise.all([
        supabase
          .from('transport_bookings')
          .select('actual_price, created_at')
          .eq('user_id', user.user.id)
          .eq('status', 'completed'),
        supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', user.user.id)
          .single(),
        supabase
          .from('clients')
          .select('created_at')
          .eq('user_id', user.user.id)
          .single()
      ]);

      const orders = ordersResult.data || [];
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.actual_price || 0), 0);
      
      const daysSinceRegistration = profileResult.data 
        ? Math.floor((Date.now() - new Date(profileResult.data.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate loyalty points (10 points per 1000 CDF spent + 50 points per order)
      const loyaltyPoints = Math.floor(totalSpent / 1000) * 10 + totalOrders * 50;

      // Determine user level
      let currentLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
      if (loyaltyPoints >= 1000) currentLevel = 'Platinum';
      else if (loyaltyPoints >= 500) currentLevel = 'Gold';
      else if (loyaltyPoints >= 200) currentLevel = 'Silver';

      setUserStats({
        total_orders: totalOrders,
        total_spent: totalSpent,
        loyalty_points: loyaltyPoints,
        current_level: currentLevel,
        days_since_registration: daysSinceRegistration
      });

      // Generate available rewards based on user stats
      const availableRewards: UserReward[] = [];

      // Level-based rewards
      if (currentLevel === 'Silver' && totalOrders >= 5) {
        availableRewards.push({
          id: 'silver-discount',
          title: 'Réduction Argent',
          description: '10% de réduction sur votre prochaine course',
          reward_type: 'discount',
          reward_value: 10,
          is_claimed: false
        });
      }

      if (currentLevel === 'Gold' && totalOrders >= 10) {
        availableRewards.push({
          id: 'gold-free-delivery',
          title: 'Livraison Gratuite Or',
          description: 'Livraison gratuite pour vos 3 prochaines commandes',
          reward_type: 'free_delivery',
          reward_value: 3,
          is_claimed: false
        });
      }

      // Points-based rewards
      if (loyaltyPoints >= 100) {
        availableRewards.push({
          id: 'points-discount-5',
          title: 'Réduction 5%',
          description: 'Échanger 100 points contre 5% de réduction',
          reward_type: 'discount',
          reward_value: 5,
          points_required: 100,
          is_claimed: false
        });
      }

      if (loyaltyPoints >= 250) {
        availableRewards.push({
          id: 'points-discount-15',
          title: 'Réduction 15%',
          description: 'Échanger 250 points contre 15% de réduction',
          reward_type: 'discount',
          reward_value: 15,
          points_required: 250,
          is_claimed: false
        });
      }

      // Anniversary reward
      if (daysSinceRegistration > 0 && daysSinceRegistration % 365 === 0) {
        availableRewards.push({
          id: 'anniversary-gift',
          title: 'Cadeau Anniversaire',
          description: 'Bon de 10000 CDF pour fêter votre fidélité',
          reward_type: 'gift',
          reward_value: 10000,
          is_claimed: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      setRewards(availableRewards);
    } catch (error) {
      console.error('Erreur lors de la récupération des récompenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) return false;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      // Create promo code for the reward
      const promoCode = `REWARD${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase.from('promo_codes').insert({
        code: promoCode,
        title: reward.title,
        description: reward.description,
        discount_type: reward.reward_type === 'discount' ? 'percentage' : 
                     reward.reward_type === 'gift' ? 'fixed_amount' : 'free_delivery',
        discount_value: reward.reward_value,
        min_order_amount: 0,
        applicable_services: ['transport', 'delivery', 'marketplace'],
        usage_limit: 1,
        user_limit: 1,
        valid_until: reward.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user.user.id
      });

      if (error) throw error;

      // Deduct points if required
      if (reward.points_required && userStats) {
        // Here we would update the user's points in a dedicated table
        // For now, we'll update the local state
        setUserStats(prev => prev ? {
          ...prev,
          loyalty_points: prev.loyalty_points - (reward.points_required || 0)
        } : null);
      }

      // Mark reward as claimed
      setRewards(prev => prev.map(r => 
        r.id === rewardId ? { ...r, is_claimed: true } : r
      ));

      toast({
        title: "Récompense réclamée !",
        description: `Code promo ${promoCode} ajouté à votre compte`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUserRewards();
  }, []);

  return {
    rewards,
    userStats,
    isLoading,
    claimReward,
    refreshRewards: fetchUserRewards
  };
};