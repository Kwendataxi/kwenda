import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PartnerDriver {
  id: string;
  partner_id: string;
  driver_id: string;
  driver_code: string;
  commission_rate: number;
  status: string;
  added_at: string;
  driver_name?: string;
  driver_phone?: string;
}

export const usePartnerDrivers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<PartnerDriver[]>([]);
  const [addingDriver, setAddingDriver] = useState(false);

  const fetchPartnerDrivers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_drivers')
        .select('*')
        .eq('partner_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching partner drivers:', error);
        return;
      }

      // Fetch driver profiles for each driver
      const driversWithProfiles = await Promise.all(
        (data || []).map(async (driver) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, phone_number')
            .eq('user_id', driver.driver_id)
            .maybeSingle();

          return {
            ...driver,
            driver_name: profile?.display_name || 'Chauffeur',
            driver_phone: profile?.phone_number || ''
          };
        })
      );

      setDrivers(driversWithProfiles);
    } catch (error) {
      console.error('Error fetching partner drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDriverByCode = async (driverCode: string, commissionRate: number) => {
    if (!user || !driverCode.trim()) return;

    try {
      setAddingDriver(true);

      // First, verify the driver code exists and is active
      const { data: codeData, error: codeError } = await supabase
        .from('driver_codes')
        .select('driver_id')
        .eq('code', driverCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (codeError) {
        console.error('Error verifying driver code:', codeError);
        toast.error('Erreur lors de la vérification du code');
        return false;
      }

      if (!codeData) {
        toast.error('Code chauffeur invalide ou expiré');
        return false;
      }

      // Check if driver is already assigned to this partner
      const { data: existingAssignment, error: checkError } = await supabase
        .from('partner_drivers')
        .select('id')
        .eq('partner_id', user.id)
        .eq('driver_id', codeData.driver_id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing assignment:', checkError);
        toast.error('Erreur lors de la vérification');
        return false;
      }

      if (existingAssignment) {
        toast.error('Ce chauffeur est déjà dans votre flotte');
        return false;
      }

      // Check if driver is assigned to another partner
      const { data: otherAssignment, error: otherError } = await supabase
        .from('partner_drivers')
        .select('id')
        .eq('driver_id', codeData.driver_id)
        .eq('status', 'active')
        .maybeSingle();

      if (otherError) {
        console.error('Error checking other assignments:', otherError);
        toast.error('Erreur lors de la vérification');
        return false;
      }

      if (otherAssignment) {
        toast.error('Ce chauffeur est déjà assigné à un autre partenaire');
        return false;
      }

      // Add the driver to the partner's fleet
      const { data, error } = await supabase
        .from('partner_drivers')
        .insert({
          partner_id: user.id,
          driver_id: codeData.driver_id,
          driver_code: driverCode.toUpperCase(),
          commission_rate: commissionRate,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding driver:', error);
        toast.error('Erreur lors de l\'ajout du chauffeur');
        return false;
      }

      toast.success('Chauffeur ajouté avec succès!');
      await fetchPartnerDrivers(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error adding driver by code:', error);
      toast.error('Erreur lors de l\'ajout du chauffeur');
      return false;
    } finally {
      setAddingDriver(false);
    }
  };

  const updateDriverCommission = async (driverId: string, newRate: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('partner_drivers')
        .update({ commission_rate: newRate })
        .eq('partner_id', user.id)
        .eq('id', driverId);

      if (error) {
        console.error('Error updating commission:', error);
        toast.error('Erreur lors de la mise à jour');
        return false;
      }

      toast.success('Taux de commission mis à jour!');
      await fetchPartnerDrivers(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error updating driver commission:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  };

  const removeDriver = async (driverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('partner_drivers')
        .update({ status: 'inactive' })
        .eq('partner_id', user.id)
        .eq('id', driverId);

      if (error) {
        console.error('Error removing driver:', error);
        toast.error('Erreur lors de la suppression');
        return false;
      }

      toast.success('Chauffeur retiré de votre flotte');
      await fetchPartnerDrivers(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error removing driver:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPartnerDrivers();
    }
  }, [user]);

  return {
    loading,
    drivers,
    addingDriver,
    addDriverByCode,
    updateDriverCommission,
    removeDriver,
    fetchPartnerDrivers
  };
};