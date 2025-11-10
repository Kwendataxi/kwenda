import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PartnerGroup {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  vehicleCount: number;
  avgRating: number;
  ratingCount: number;
  followersCount: number;
  tier: string;
  vehicles: any[];
  topVehicles: any[]; // 3 meilleurs véhicules pour preview
}

export const usePartnerRentalGroups = (city?: string) => {
  // Fetch all vehicles with partner info
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['rental-vehicles-grouped', city],
    queryFn: async () => {
      // Fetch partners
      const { data: allPartners } = await supabase
        .from('partenaires')
        .select('id, user_id, company_name');

      // Fetch profiles for avatars
      const userIds = allPartners?.map(p => p.user_id) || [];
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, avatar_url, display_name')
        .in('id', userIds);

      // Merge partners with profiles
      const partnersWithProfiles = allPartners?.map(p => ({
        ...p,
        avatar_url: allProfiles?.find(pr => pr.id === p.user_id)?.avatar_url,
        display_name: allProfiles?.find(pr => pr.id === p.user_id)?.display_name
      }));

      let query = supabase
        .from('rental_vehicles')
        .select(`
          *,
          category:rental_vehicle_categories(id, name, icon)
        `)
        .eq('is_available', true)
        .eq('is_active', true)
        .eq('moderation_status', 'approved');

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      let vehiclesWithPartner = (data || []).map(v => ({
        ...v,
        partner: partnersWithProfiles?.find(p => p.id === v.partner_id)
      }));

      // Filtrer par ville si spécifiée (utiliser available_cities comme useModernRentals)
      if (city) {
        vehiclesWithPartner = vehiclesWithPartner.filter((v: any) => {
          const cities = Array.isArray(v.available_cities) ? v.available_cities : [];
          return cities.includes(city);
        });
      }
      
      return vehiclesWithPartner;
    }
  });

  // Fetch partner stats
  const { data: stats = [] } = useQuery({
    queryKey: ['partner-rental-stats-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_stats')
        .select('*');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch followers count for all partners
  const { data: followersData = [] } = useQuery({
    queryKey: ['partner-followers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_followers')
        .select('partner_id')
        .returns<{ partner_id: string }[]>();

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch subscriptions for tiers
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['partner-subscriptions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select(`
          partner_id,
          plan:rental_subscription_plans(tier)
        `)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());

      if (error) throw error;
      return data || [];
    }
  });

  // Group vehicles by partner
  const partnerGroups = useMemo<PartnerGroup[]>(() => {
    const groupsMap = new Map<string, PartnerGroup>();

    vehicles.forEach(vehicle => {
      const partner = vehicle.partner;
      if (!partner) return;

      const partnerId = partner.id;

      if (!groupsMap.has(partnerId)) {
        const partnerStats = stats.find(s => s.partner_id === partnerId);
        const followersCount = followersData.filter(f => f.partner_id === partnerId).length;
        const subscription = subscriptions.find(s => s.partner_id === partnerId);
        
        groupsMap.set(partnerId, {
          partnerId,
          partnerName: partner.company_name,
          partnerAvatar: partner.avatar_url || null,
          vehicleCount: 0,
          avgRating: partnerStats?.rating_average || 0,
          ratingCount: partnerStats?.rating_count || 0,
          followersCount,
          tier: subscription?.plan?.tier || 'basic',
          vehicles: [],
          topVehicles: []
        });
      }

      const group = groupsMap.get(partnerId)!;
      group.vehicles.push(vehicle);
      group.vehicleCount++;
    });

    // Sort vehicles by price (lowest first) and take top 3 for preview
    groupsMap.forEach(group => {
      group.topVehicles = [...group.vehicles]
        .sort((a, b) => a.daily_rate - b.daily_rate)
        .slice(0, 3);
    });

    return Array.from(groupsMap.values())
      .sort((a, b) => {
        // Premium partners (gold, platinum) first
        const tierOrder = { platinum: 0, gold: 1, silver: 2, basic: 3 };
        const aTier = tierOrder[a.tier as keyof typeof tierOrder] ?? 99;
        const bTier = tierOrder[b.tier as keyof typeof tierOrder] ?? 99;
        
        if (aTier !== bTier) return aTier - bTier;
        
        // Then by rating
        if (Math.abs(a.avgRating - b.avgRating) > 0.1) {
          return b.avgRating - a.avgRating;
        }
        
        // Then by vehicle count
        return b.vehicleCount - a.vehicleCount;
      });
  }, [vehicles, stats, followersData, subscriptions]);

  // Get premium partners (gold and platinum)
  const premiumPartners = useMemo(() => {
    return partnerGroups.filter(p => p.tier === 'gold' || p.tier === 'platinum');
  }, [partnerGroups]);

  return {
    partnerGroups,
    premiumPartners,
    isLoading,
    totalPartners: partnerGroups.length,
    totalVehicles: vehicles.length
  };
};
