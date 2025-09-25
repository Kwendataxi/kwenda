import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PartnerRegistrationDataSecure {
  company_name: string;
  contact_email: string;
  phone: string;
  address?: string;
  business_type: 'individual' | 'company' | 'cooperative' | 'association';
  service_areas: string[];
  business_license?: string;
  tax_number?: string;
  commission_rate?: number;
  commission_type?: 'percentage' | 'fixed';
}

export const usePartnerRegistrationSecure = () => {
  const [loading, setLoading] = useState(false);

  const registerPartner = async (data: PartnerRegistrationDataSecure) => {
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
        .maybeSingle();

      if (existingPartner) {
        throw new Error('Vous avez déjà un profil partenaire');
      }

      // Utiliser la fonction de validation sécurisée
      const { data: validationResult } = await supabase
        .rpc('validate_partner_registration_secure', {
          p_company_name: data.company_name,
          p_email: data.contact_email,
          p_phone_number: data.phone,
          p_commission_rate: data.commission_rate || 15.00
        });

      const validation = validationResult as any;
      if (!validation?.valid) {
        const errors = validation?.errors || [];
        throw new Error(`Erreur de validation: ${errors.join(', ')}`);
      }

      // Validation des zones de service
      if (!data.service_areas || data.service_areas.length === 0) {
        throw new Error('Au moins une zone de service est requise');
      }

      // Obtenir la configuration commission par défaut de manière sécurisée
      const { data: commissionConfig } = await supabase
        .from('commission_configuration')
        .select('partner_commission_rate')
        .eq('service_type', 'transport')
        .eq('is_active', true)
        .maybeSingle();

      const defaultCommissionRate = commissionConfig?.partner_commission_rate || 15.00;

      // Créer le profil partenaire avec toutes les données
      const { error } = await supabase
        .from('partenaires')
        .insert([{
          user_id: user.id,
          display_name: data.company_name,
          company_name: data.company_name,
          phone_number: data.phone,
          email: data.contact_email,
          address: data.address || '',
          business_type: data.business_type,
          business_license: data.business_license,
          tax_number: data.tax_number,
          commission_rate: data.commission_rate || defaultCommissionRate,
          verification_status: 'pending',
          is_active: false,
          service_areas: data.service_areas
        }]);

      if (error) {
        // Logger l'échec d'inscription pour le monitoring de sécurité
        await supabase.rpc('log_system_activity', {
          p_activity_type: 'partner_registration_failed',
          p_description: 'Failed partner registration attempt',
          p_metadata: { 
            error: error.message,
            company_name: data.company_name,
            email: data.contact_email
          }
        });
        throw error;
      }

      // Logger le succès d'inscription
      await supabase.rpc('log_system_activity', {
        p_activity_type: 'partner_registration_success',
        p_description: 'New partner registered successfully',
        p_metadata: { 
          company_name: data.company_name,
          business_type: data.business_type,
          service_areas: data.service_areas
        }
      });

      // Envoyer une notification aux admins via edge function sécurisée
      try {
        await supabase.functions.invoke('smart-notification-dispatcher', {
          body: {
            type: 'partner_registration',
            data: {
              partner_name: data.company_name,
              business_type: data.business_type,
              service_areas: data.service_areas,
              user_id: user.id
            }
          }
        });
      } catch (notificationError) {
        // Ne pas faire échouer l'inscription si la notification échoue
        console.warn('Notification failed:', notificationError);
      }

      toast.success('Demande de partenariat envoyée avec succès! Votre demande est en cours de traitement.');
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
        .maybeSingle();

      return partner;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut partenaire:', error);
      return null;
    }
  };

  const updateCommissionRate = async (newRate: number) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Vous devez être connecté');
      }

      // Valider le nouveau taux via la fonction sécurisée
      const { data: validationResult } = await supabase
        .rpc('validate_partner_registration_secure', {
          p_company_name: 'dummy', // Requis mais pas utilisé pour la validation du taux
          p_email: 'dummy@test.com', // Requis mais pas utilisé pour la validation du taux
          p_phone_number: '+243999999999', // Requis mais pas utilisé pour la validation du taux
          p_commission_rate: newRate
        });

      const validation = validationResult as any;
      if (!validation?.valid) {
        const errors = validation?.errors || [];
        throw new Error(`Taux de commission invalide: ${errors.join(', ')}`);
      }

      const { error } = await supabase
        .from('partenaires')
        .update({ 
          commission_rate: newRate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Logger la mise à jour
      await supabase.rpc('log_system_activity', {
        p_activity_type: 'partner_commission_updated',
        p_description: 'Partner commission rate updated',
        p_metadata: { 
          new_rate: newRate,
          user_id: user.id
        }
      });

      toast.success('Taux de commission mis à jour avec succès');
      return true;
    } catch (error: any) {
      console.error('Error updating commission rate:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getSecurityStatus = async () => {
    try {
      const { data: securityStatus } = await supabase
        .rpc('check_security_status');

      return securityStatus;
    } catch (error) {
      console.error('Error checking security status:', error);
      return null;
    }
  };

  return {
    registerPartner,
    checkPartnerStatus,
    updateCommissionRate,
    getSecurityStatus,
    loading
  };
};