/**
 * 🟢 Hook de Gestion du Statut Chauffeur
 * Gère l'état en ligne/hors ligne + disponibilité
 * SYNCHRONISÉ avec driver_profiles dans la DB
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DriverStatus {
  isOnline: boolean;
  isAvailable: boolean;
  currentOrderId: string | null;
  currentOrderType: 'taxi' | 'delivery' | 'marketplace' | null;
  serviceTypes: string[];
}

export const useDriverStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DriverStatus>({
    isOnline: false,
    isAvailable: false,
    currentOrderId: null,
    currentOrderType: null,
    serviceTypes: ['taxi', 'delivery', 'marketplace']
  });

  // ✅ PHASE 2: Charger le statut depuis chauffeurs (is_active)
  const loadDriverStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data: driverProfile, error } = await supabase
        .from('chauffeurs')
        .select('is_active, verification_status')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading driver status:', error);
        return;
      }

      if (driverProfile) {
        setStatus({
          isOnline: driverProfile.is_active || false,
          isAvailable: driverProfile.is_active && driverProfile.verification_status === 'verified',
          currentOrderId: null, // Géré par useDriverDispatch
          currentOrderType: null,
          serviceTypes: ['taxi', 'delivery', 'marketplace']
        });
      }
    } catch (error: any) {
      console.error('Error loading driver status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ PHASE 2: Passer en ligne (utiliser chauffeurs.is_active)
  const goOnline = async (latitude?: number, longitude?: number): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chauffeurs')
        .update({ is_active: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error going online:', error);
        toast.error('Impossible de passer en ligne');
        return false;
      }

      setStatus(prev => ({ ...prev, isOnline: true, isAvailable: true }));
      toast.success('✅ Vous êtes maintenant en ligne');
      return true;
    } catch (error: any) {
      console.error('Error going online:', error);
      toast.error('Erreur lors de la mise en ligne');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ PHASE 2: Passer hors ligne (utiliser chauffeurs.is_active)
  const goOffline = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chauffeurs')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error going offline:', error);
        toast.error('Impossible de passer hors ligne');
        return false;
      }

      setStatus(prev => ({ ...prev, isOnline: false, isAvailable: false }));
      toast.info('⏸️ Vous êtes maintenant hors ligne');
      return true;
    } catch (error: any) {
      console.error('Error going offline:', error);
      toast.error('Erreur lors de la mise hors ligne');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Marquer comme disponible
  const setAvailable = async (isAvailable: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_available: isAvailable })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating availability:', error);
        return false;
      }

      setStatus(prev => ({ ...prev, isAvailable }));
      toast.success(isAvailable ? '✅ Vous êtes disponible' : 'Vous êtes occupé');
      return true;
    } catch (error: any) {
      console.error('Error updating availability:', error);
      return false;
    }
  };

  // ✅ Marquer comme occupé (avec commande en cours)
  const markBusy = async (orderId: string, orderType: 'taxi' | 'delivery' | 'marketplace'): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({
          is_available: false,
          current_order_id: orderId,
          current_order_type: orderType
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking busy:', error);
        return false;
      }

      setStatus(prev => ({
        ...prev,
        isAvailable: false,
        currentOrderId: orderId,
        currentOrderType: orderType
      }));

      return true;
    } catch (error: any) {
      console.error('Error marking busy:', error);
      return false;
    }
  };

  // ✅ Marquer comme disponible (terminer la commande)
  const markAvailable = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({
          is_available: true,
          current_order_id: null,
          current_order_type: null
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking available:', error);
        return false;
      }

      setStatus(prev => ({
        ...prev,
        isAvailable: true,
        currentOrderId: null,
        currentOrderType: null
      }));

      return true;
    } catch (error: any) {
      console.error('Error marking available:', error);
      return false;
    }
  };

  // ✅ Mettre à jour les types de service acceptés
  const updateServiceTypes = async (serviceTypes: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_service_preferences')
        .update({ service_types: serviceTypes })
        .eq('driver_id', user.id);

      if (error) {
        console.error('Error updating service types:', error);
        return false;
      }

      setStatus(prev => ({ ...prev, serviceTypes }));
      toast.success('Préférences de service mises à jour');
      return true;
    } catch (error: any) {
      console.error('Error updating service types:', error);
      return false;
    }
  };

  // Charger le statut au montage
  useEffect(() => {
    if (user) {
      loadDriverStatus();
    }
  }, [user, loadDriverStatus]);

  return {
    status,
    loading,
    goOnline,
    goOffline,
    setAvailable,
    markBusy,
    markAvailable,
    updateServiceTypes
  };
};
