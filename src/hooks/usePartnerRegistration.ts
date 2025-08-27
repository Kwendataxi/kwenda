import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PartnerRegistrationData {
  company_name: string;
  contact_email: string;
  phone: string;
  address?: string;
  business_type: string;
  service_areas: string[];
  business_license?: string;
  tax_number?: string;
  commission_rate: number;
}

export const usePartnerRegistration = () => {
  const [loading, setLoading] = useState(false);

  const registerPartner = async (data: PartnerRegistrationData) => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier si l'utilisateur a déjà un profil partenaire
      const { data: existingPartner } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPartner) {
        throw new Error('Vous avez déjà un profil partenaire');
      }

      // Créer le profil partenaire
      const { error } = await supabase
        .from('partenaires')
        .insert([{
          user_id: user.id,
          display_name: data.company_name,
          phone_number: data.phone,
          email: data.contact_email,
          address: data.address || '',
          business_type: data.business_type,
          company_name: data.company_name,
          commission_rate: data.commission_rate,
          verification_status: 'pending',
          is_active: false
        } as any]);

      if (error) throw error;

      toast.success('Demande de partenariat envoyée avec succès!');
      return { success: true };

    } catch (error: any) {
      console.error('Erreur lors de l\'inscription partenaire:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const checkPartnerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: partner } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return partner;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut partenaire:', error);
      return null;
    }
  };

  return {
    registerPartner,
    checkPartnerStatus,
    loading
  };
};