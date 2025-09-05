import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VIPLevel {
  name: string;
  minRides: number;
  color: string;
  benefits: string[];
  icon: string;
}

export interface VIPStatus {
  currentLevel: VIPLevel;
  currentRides: number;
  nextLevel: VIPLevel | null;
  ridesUntilNext: number;
  progressPercentage: number;
}

const VIP_LEVELS: VIPLevel[] = [
  { name: 'Bronze', minRides: 0, color: '#9CA3AF', benefits: ['Support de base'], icon: '🥉' },
  { name: 'Silver', minRides: 5, color: '#C0C0C0', benefits: ['Support prioritaire'], icon: '🥈' },
  { name: 'Gold', minRides: 15, color: '#FFD700', benefits: ['Support VIP'], icon: '🥇' },
  { name: 'Platinum', minRides: 50, color: '#E5E7EB', benefits: ['Support 24/7'], icon: '💎' }
];

export const useVIPStatus = () => {
  const [totalRides, setTotalRides] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', user.id)
            .eq('status', 'completed');
          setTotalRides(count || 0);
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    };
    fetchRides();
  }, []);

  let currentLevel = VIP_LEVELS[0];
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (totalRides >= VIP_LEVELS[i].minRides) {
      currentLevel = VIP_LEVELS[i];
      break;
    }
  }

  const currentIndex = VIP_LEVELS.findIndex(level => level.name === currentLevel.name);
  const nextLevel = currentIndex < VIP_LEVELS.length - 1 ? VIP_LEVELS[currentIndex + 1] : null;
  const ridesUntilNext = nextLevel ? nextLevel.minRides - totalRides : 0;
  const progressPercentage = nextLevel ? ((totalRides - currentLevel.minRides) / (nextLevel.minRides - currentLevel.minRides)) * 100 : 100;

  const vipStatus: VIPStatus = {
    currentLevel,
    currentRides: totalRides,
    nextLevel,
    ridesUntilNext,
    progressPercentage: Math.max(0, Math.min(100, progressPercentage))
  };

  return { vipStatus, loading, VIP_LEVELS };
};