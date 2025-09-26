import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook pour simuler des chauffeurs en ligne pour les tests
 */
export function useDriverSimulation() {
  
  const createTestDrivers = async () => {
    try {
      console.log('🚗 Création de chauffeurs de test...');

      // Créer quelques chauffeurs de test dans différentes zones de Kinshasa
      const testDrivers = [
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440001', // UUID de test
          latitude: -4.3217,  // Centre de Kinshasa
          longitude: 15.3069,
          is_online: true,
          is_available: true,
          vehicle_class: 'standard',
          last_ping: new Date().toISOString(),
          is_verified: true
        },
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440002',
          latitude: -4.3140,  // Gombe
          longitude: 15.3120,
          is_online: true,
          is_available: true,
          vehicle_class: 'premium',
          last_ping: new Date().toISOString(),
          is_verified: true
        },
        {
          driver_id: '550e8400-e29b-41d4-a716-446655440003',
          latitude: -4.3350,  // Bandalungwa  
          longitude: 15.2950,
          is_online: true,
          is_available: true,
          vehicle_class: 'standard',
          last_ping: new Date().toISOString(),
          is_verified: false
        }
      ];

      // Supprimer les anciens chauffeurs de test puis insérer les nouveaux
      await supabase
        .from('driver_locations')
        .delete()
        .in('driver_id', testDrivers.map(d => d.driver_id));

      const { error } = await supabase
        .from('driver_locations')
        .insert(testDrivers);

      if (error) {
        console.error('Erreur création chauffeurs test:', error);
        return false;
      }

      console.log('✅ Chauffeurs de test créés:', testDrivers.length);
      return true;

    } catch (error) {
      console.error('Erreur simulation chauffeurs:', error);
      return false;
    }
  };

  const startDriverSimulation = async () => {
    const success = await createTestDrivers();
    if (success) {
      toast.success('Chauffeurs de test créés pour les démonstrations');
    } else {
      toast.error('Erreur lors de la création des chauffeurs de test');
    }
  };

  const stopDriverSimulation = async () => {
    try {
      // Supprimer tous les chauffeurs de test
      const { error } = await supabase
        .from('driver_locations')
        .delete()
        .like('driver_id', '550e8400-e29b-41d4-a716-44665544%');

      if (error) {
        console.error('Erreur suppression chauffeurs test:', error);
        toast.error('Erreur lors de la suppression des chauffeurs de test');
        return;
      }

      toast.info('Chauffeurs de test supprimés');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return {
    startDriverSimulation,
    stopDriverSimulation,
    createTestDrivers
  };
}