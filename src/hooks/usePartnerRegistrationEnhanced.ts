import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PartnerRegistrationDataEnhanced {
  company_name: string;
  contact_email: string;
  phone: string;
  address?: string;
  business_type: 'individual' | 'company' | 'cooperative' | 'association';
  service_areas: string[];
  business_license?: string;
  tax_number?: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
}

export const usePartnerRegistrationEnhanced = () => {
  const [loading, setLoading] = useState(false);

  const registerPartner = async (data: PartnerRegistrationDataEnhanced) => {
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

      // Validation des données
      if (data.commission_rate < 0 || data.commission_rate > 50) {
        throw new Error('Le taux de commission doit être entre 0% et 50%');
      }

      if (!data.service_areas || data.service_areas.length === 0) {
        throw new Error('Au moins une zone de service est requise');
      }

      // Obtenir la configuration commission par défaut
      const { data: commissionConfig } = await supabase
        .from('commission_configuration')
        .select('partner_commission_rate')
        .eq('service_type', 'transport')
        .eq('is_active', true)
        .single();

      const defaultCommissionRate = commissionConfig?.partner_commission_rate || 15.00;

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
          commission_rate: data.commission_rate || defaultCommissionRate,
          verification_status: 'pending',
          is_active: false,
          service_areas: data.service_areas
        }]);

      if (error) throw error;

      // Logger l'inscription
      await supabase.functions.invoke('smart-notification-dispatcher', {
        body: {
          type: 'partner_registration',
          data: {
            partner_name: data.company_name,
            business_type: data.business_type,
            service_areas: data.service_areas
          }
        }
      });

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

  const updateCommissionRate = async (newRate: number) => {
    if (newRate < 0 || newRate > 50) {
      throw new Error('Le taux de commission doit être entre 0% et 50%');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('partenaires')
      .update({ 
        commission_rate: newRate,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) throw error;

    toast.success('Taux de commission mis à jour');
  };

  return {
    registerPartner,
    checkPartnerStatus,
    updateCommissionRate,
    loading
  };
};