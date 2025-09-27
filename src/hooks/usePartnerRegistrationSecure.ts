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
      console.log('Starting partner registration with data:', {
        email: data.contact_email,
        company_name: data.company_name,
        business_type: data.business_type,
        service_areas: data.service_areas,
        address: data.address || 'Adresse non spécifiée'
      });

      // Use client-side signup with metadata for trigger
      const { data: authResult, error } = await supabase.auth.signUp({
        email: data.contact_email,
        password: data.password,
        options: {
          data: {
            role: 'partner',
            company_name: data.company_name,
            phone_number: data.phone,
            business_type: data.business_type,
            service_areas: data.service_areas,
            address: data.address || 'Adresse non spécifiée',
            business_license: data.business_license,
            tax_number: data.tax_number
          }
        }
      });

      console.log('Auth signup result:', { authResult, error });

      if (error) {
        console.error('Registration error:', error);
        throw new Error(error.message || 'Erreur lors de l\'inscription du partenaire');
      }

      // Check if the registration was successful
      if (authResult?.user?.id) {
        console.log('Registration successful, user created:', authResult.user.id);
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
                email: data.contact_email,
                user_id: authResult.user.id
              }
            }
          });
          console.log('Admin notification sent successfully');
        } catch (notificationError) {
          console.warn('Admin notification failed:', notificationError);
        }

        return { success: true, user: authResult.user };
      } else {
        console.error('No user returned from registration:', authResult);
        throw new Error('Erreur lors de la création du compte partenaire');
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