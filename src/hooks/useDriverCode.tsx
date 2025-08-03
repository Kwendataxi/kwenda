import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DriverCode {
  id: string;
  code: string;
  driver_id: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface PartnerAssignment {
  id: string;
  partner_id: string;
  driver_id: string;
  driver_code: string;
  commission_rate: number;
  status: string;
  added_at: string;
  partner_name?: string;
}

export const useDriverCode = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [driverCode, setDriverCode] = useState<DriverCode | null>(null);
  const [partnerAssignment, setPartnerAssignment] = useState<PartnerAssignment | null>(null);

  const fetchDriverCode = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_codes')
        .select('*')
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching driver code:', error);
        return;
      }

      setDriverCode(data);
    } catch (error) {
      console.error('Error fetching driver code:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerAssignment = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_drivers')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching partner assignment:', error);
        return;
      }

      if (data) {
        // Fetch partner profile separately
        const { data: partnerData } = await supabase
          .from('partner_profiles')
          .select('company_name')
          .eq('user_id', data.partner_id)
          .maybeSingle();

        setPartnerAssignment({
          ...data,
          partner_name: partnerData?.company_name || 'Partenaire'
        });
      }
    } catch (error) {
      console.error('Error fetching partner assignment:', error);
    }
  };

  const generateCode = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First generate a unique code
      const { data: newCode, error: codeError } = await supabase
        .rpc('generate_driver_code');

      if (codeError) {
        console.error('Error generating code:', codeError);
        toast.error('Erreur lors de la génération du code');
        return;
      }

      // Then create the driver code record
      const { data, error } = await supabase
        .from('driver_codes')
        .insert({
          code: newCode,
          driver_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating driver code:', error);
        toast.error('Erreur lors de la création du code');
        return;
      }

      setDriverCode(data);
      toast.success('Code généré avec succès!');
    } catch (error) {
      console.error('Error generating driver code:', error);
      toast.error('Erreur lors de la génération du code');
    } finally {
      setLoading(false);
    }
  };

  const shareCode = async () => {
    if (!driverCode) return;

    const shareText = `Mon code chauffeur Kwenda: ${driverCode.code}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Code Chauffeur Kwenda',
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(driverCode.code);
        toast.success('Code copié dans le presse-papiers!');
      }
    } catch (error) {
      console.error('Error sharing code:', error);
      toast.error('Erreur lors du partage');
    }
  };

  const copyCode = async () => {
    if (!driverCode) return;

    try {
      await navigator.clipboard.writeText(driverCode.code);
      toast.success('Code copié dans le presse-papiers!');
    } catch (error) {
      console.error('Error copying code:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  useEffect(() => {
    if (user) {
      fetchDriverCode();
      fetchPartnerAssignment();
    }
  }, [user]);

  return {
    loading,
    driverCode,
    partnerAssignment,
    generateCode,
    shareCode,
    copyCode,
    fetchDriverCode,
    fetchPartnerAssignment
  };
};