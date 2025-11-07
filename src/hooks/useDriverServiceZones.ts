/**
 * 🗺️ Hook gestion zones de service chauffeur
 * - Chargement des zones disponibles
 * - Activation/désactivation des zones
 * - Sauvegarde dans chauffeurs.service_areas
 * - Statistiques par zone
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ServiceZone {
  id: string;
  name: string;
  city: string;
  active: boolean;
  polygon?: any;
  rides_count?: number;
  earnings?: number;
  demand_level?: 'low' | 'medium' | 'high';
}

export const useDriverServiceZones = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Charger toutes les zones disponibles
  const { data: availableZones, isLoading: loadingZones } = useQuery({
    queryKey: ['service-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_zones')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Charger les zones actives du chauffeur
  const { data: driverZones, isLoading: loadingDriver } = useQuery({
    queryKey: ['driver-service-zones', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('chauffeurs')
        .select('service_areas')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Charger les stats par zone
  const { data: zoneStats } = useQuery({
    queryKey: ['zone-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Stats courses par zone
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('pickup_zone, fare')
        .eq('driver_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;

      // Agréger par zone
      const stats = data?.reduce((acc: any, booking: any) => {
        const zone = booking.pickup_zone || 'unknown';
        if (!acc[zone]) {
          acc[zone] = { rides: 0, earnings: 0 };
        }
        acc[zone].rides += 1;
        acc[zone].earnings += booking.fare || 0;
        return acc;
      }, {});

      return stats;
    },
    enabled: !!user
  });

  // Combiner les données pour afficher les zones avec leur statut
  const zones: ServiceZone[] = (availableZones || []).map((zone: any) => {
    const activeZones = Array.isArray(driverZones?.service_areas) 
      ? driverZones.service_areas 
      : [];
    const stats = zoneStats?.[zone.name] || { rides: 0, earnings: 0 };

    return {
      id: zone.id,
      name: zone.name,
      city: zone.city,
      active: activeZones.includes(zone.id),
      polygon: zone.polygon,
      rides_count: stats.rides,
      earnings: stats.earnings,
      demand_level: stats.rides > 30 ? 'high' : stats.rides > 10 ? 'medium' : 'low'
    };
  });

  // Toggle une zone
  const toggleZone = useMutation({
    mutationFn: async (zoneId: string) => {
      if (!user) throw new Error('Non authentifié');

      const currentZones = Array.isArray(driverZones?.service_areas) 
        ? driverZones.service_areas 
        : [];
      
      const isActive = currentZones.includes(zoneId);
      const newZones = isActive
        ? currentZones.filter((id: string) => id !== zoneId)
        : [...currentZones, zoneId];

      const { error } = await supabase
        .from('chauffeurs')
        .update({ service_areas: newZones })
        .eq('user_id', user.id);

      if (error) throw error;

      return { zoneId, isActive: !isActive };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-service-zones'] });
      toast.success(
        data.isActive 
          ? 'Zone activée avec succès' 
          : 'Zone désactivée'
      );
    },
    onError: (error) => {
      console.error('Error toggling zone:', error);
      toast.error('Erreur lors de la mise à jour des zones');
    }
  });

  // Activer plusieurs zones à la fois
  const setActiveZones = useMutation({
    mutationFn: async (zoneIds: string[]) => {
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('chauffeurs')
        .update({ service_areas: zoneIds })
        .eq('user_id', user.id);

      if (error) throw error;
      return zoneIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-service-zones'] });
      toast.success('Zones mises à jour');
    }
  });

  const activeZones = zones.filter(z => z.active);
  const suggestedZones = zones
    .filter(z => !z.active && z.demand_level === 'high')
    .slice(0, 3);

  return {
    zones,
    activeZones,
    suggestedZones,
    driverCity: undefined, // Ville supprimée du schéma
    loading: loadingZones || loadingDriver,
    toggleZone,
    setActiveZones,
    zoneStats
  };
};
