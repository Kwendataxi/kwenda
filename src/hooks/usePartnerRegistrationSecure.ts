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
          emailRedirectTo: `${window.location.origin}/partner/auth`,
          data: {
            role: 'partner',
            company_name: data.company_name,
            phone_number: data.phone,
            business_type: data.business_type,
            service_areas: JSON.stringify(data.service_areas), // Convert array to string
            address: data.address || 'Adresse non spécifiée',
            business_license: data.business_license || '',
            tax_number: data.tax_number || ''
          }
        }
      });

      console.log('Full Auth Result:', JSON.stringify(authResult, null, 2));
      console.log('Full Error:', JSON.stringify(error, null, 2));

      if (error) {
        console.error('Registration error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        throw new Error(error.message || 'Erreur lors de l\'inscription du partenaire');
      }

      // Check if the registration was successful
      if (authResult?.user?.id) {
        console.log('Registration successful, user created:', authResult.user.id);
        
        // Wait for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify partner was created by trigger
        const { data: partnerCheck, error: checkError } = await supabase
          .from('partenaires')
          .select('id, verification_status')
          .eq('user_id', authResult.user.id)
          .maybeSingle();
        
        console.log('Partner verification:', { partnerCheck, checkError });
        
        if (!partnerCheck && !checkError) {
          console.error('Partner not created by trigger, attempting manual creation');
          
          // Manual creation if trigger failed
          const { error: insertError } = await supabase
            .from('partenaires')
            .insert({
              user_id: authResult.user.id,
              email: data.contact_email,
              display_name: data.company_name,
              company_name: data.company_name,
              phone_number: data.phone,
              business_type: data.business_type,
              service_areas: data.service_areas,
              address: data.address || 'Adresse non spécifiée',
              company_registration_number: data.business_license,
              tax_number: data.tax_number,
              verification_status: 'pending'
            });
          
          if (insertError) {
            console.error('Manual partner creation failed:', insertError);
            throw new Error('Erreur lors de la création du profil partenaire');
          }
          
          console.log('Partner created manually');
        }
        
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

        // Check if email confirmation is required
        if (authResult.user && !authResult.session) {
          toast.success('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
          return { success: true, user: authResult.user, emailConfirmationRequired: true };
        }
        
        toast.success('Inscription réussie ! Votre demande est en cours de traitement par nos équipes.');
        return { success: true, user: authResult.user };
      } else {
        console.error('No user returned from registration:', authResult);
        throw new Error('Erreur lors de la création du compte partenaire');
      }

    } catch (error: any) {
      console.error('Partner registration error:', error);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.message.includes('duplicate key') || error.message.includes('already registered')) {
        errorMessage = 'Cette adresse email est déjà utilisée';
      } else if (error.message.includes('invalid email') || error.message.includes('Invalid email')) {
        errorMessage = 'Adresse email invalide';
      } else if (error.message.includes('password') || error.message.includes('Password')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
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