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

      // Créer le compte Auth sans métadonnées (pas de trigger)
      const { data: authResult, error } = await supabase.auth.signUp({
        email: data.contact_email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/partner/auth`
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
        console.log('✅ Auth account created:', authResult.user.id);
        
        // ✅ QUICK FIX: Attendre 500ms pour que auth.users soit bien propagé
        console.log('⏳ Waiting 500ms for auth propagation...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ✅ QUICK FIX: Vérifier que le user existe bien dans auth.users
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('🔍 User verification:', { userData, userError });
        
        if (userError || !userData?.user) {
          console.error('❌ User not found in auth.users after signup:', userError);
          throw new Error('Compte créé mais non accessible. Veuillez réessayer dans quelques instants.');
        }
        
        // Appeler la fonction RPC sécurisée pour créer le profil partenaire
        console.log('📞 Calling create_partner_profile_secure RPC...');
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'create_partner_profile_secure',
          {
            p_user_id: authResult.user.id,
            p_email: data.contact_email,
            p_company_name: data.company_name,
            p_phone_number: data.phone,
            p_business_type: data.business_type,
            p_service_areas: data.service_areas
          }
        ) as { data: { success: boolean; error?: string; partner_id?: string } | null; error: any };

        console.log('RPC Result:', rpcResult);
        console.log('RPC Error:', rpcError);

        if (rpcError) {
          console.error('❌ RPC Error:', rpcError);
          throw new Error(rpcError.message || 'Erreur lors de la création du profil partenaire');
        }

        // Vérifier le résultat de la fonction
        if (rpcResult && !rpcResult.success) {
          console.error('❌ Partner creation failed:', rpcResult.error);
          throw new Error(rpcResult.error || 'Erreur lors de la création du profil partenaire');
        }

        console.log('✅ Partner profile created successfully:', rpcResult);
        
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