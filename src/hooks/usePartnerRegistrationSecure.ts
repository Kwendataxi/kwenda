import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PartnerRegistrationData {
  company_name: string;
  contact_email: string;
  phone: string;
  address?: string;
  business_type: 'individual' | 'company' | 'cooperative' | 'association';
  service_areas: string[];
  business_license?: string;
  tax_number?: string;
  password: string;
}

export const usePartnerRegistrationSecure = () => {
  const [loading, setLoading] = useState(false);

  const registerPartner = async (data: PartnerRegistrationData) => {
    setLoading(true);
    try {
      // Use the secure registration function with metadata
      const { data: registrationResult, error } = await supabase.rpc(
        'register_partner_with_metadata',
        {
          p_email: data.contact_email,
          p_password: data.password,
          p_company_name: data.company_name,
          p_phone_number: data.phone,
          p_business_type: data.business_type,
          p_service_areas: data.service_areas,
          p_address: data.address || null,
          p_business_license: data.business_license || null,
          p_tax_number: data.tax_number || null
        }
      );

      if (error) {
        console.error('Registration error:', error);
        throw new Error(error.message || 'Erreur lors de l\'inscription');
      }

      // Check if the registration was successful
      const result = registrationResult as any;
      if (result?.user) {
        toast.success('Inscription réussie ! Votre demande est en cours de traitement par nos équipes.');
        
        // Try to send admin notification (non-blocking)
        try {
          await supabase.functions.invoke('smart-notification-dispatcher', {
            body: {
              type: 'partner_registration',
              data: {
                partner_name: data.company_name,
                business_type: data.business_type,
                service_areas: data.service_areas,
                email: data.contact_email
              }
            }
          });
        } catch (notificationError) {
          console.warn('Admin notification failed:', notificationError);
        }

        return { success: true, user: result.user };
      } else {
        throw new Error('Erreur lors de la création du compte');
      }

    } catch (error: any) {
      console.error('Partner registration error:', error);
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Cette adresse email est déjà utilisée';
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'Adresse email invalide';
      } else if (error.message.includes('password')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    registerPartner,
    loading
  };
};