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

      // ✅ ÉTAPE 0 : Vérifier si l'email existe déjà
      const { data: existingUser, error: checkError } = await supabase.rpc(
        'check_user_exists_by_email',
        { p_email: data.contact_email }
      );

      if (existingUser) {
        console.log('⚠️ Email already exists, user must sign in first');
        throw new Error('EMAIL_EXISTS_USE_LOGIN');
      }

      console.log('✅ Email available, proceeding with signup...');

      // Créer le compte Auth avec métadonnées (alignement driver/client)
      const { data: authResult, error } = await supabase.auth.signUp({
        email: data.contact_email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/partner/auth`,
          data: {
            user_type: 'partner',
            display_name: data.company_name,
            phone_number: data.phone,
            business_type: data.business_type,
            company_name: data.company_name
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
        
      // ✅ AMÉLIORATION : Afficher message explicite pour utilisateur existant
      if (error.message?.includes('already registered') || error.status === 422) {
        console.log('⚠️ User already exists with this email');
        throw new Error('EXISTING_USER_DETECTED');
      }
      
      throw new Error(error.message || 'Erreur lors de l\'inscription du partenaire');
      }

      // Check if the registration was successful
      if (authResult?.user?.id) {
        console.log('✅ Auth account created:', authResult.user.id);
        
        // ✅ AMÉLIORATION: Gérer immédiatement sans attente inutile
        if (!authResult.session) {
          console.warn('⚠️ Aucune session immédiate - email confirmation requise');
          
          // Stocker les données pour compléter l'inscription après confirmation
          localStorage.setItem('pendingPartnerRegistration', JSON.stringify({
            email: data.contact_email,
            company_name: data.company_name,
            phone_number: data.phone,
            business_type: data.business_type,
            service_areas: data.service_areas
          }));
          
          toast.success('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
          return { 
            success: true, 
            user: authResult.user, 
            emailConfirmationRequired: true 
          };
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
            p_service_areas: data.service_areas,
            p_display_name: data.company_name,
            p_address: data.address || 'Kinshasa, RDC'
          }
        ) as { data: { success: boolean; error?: string; partner_id?: string } | null; error: any };

        console.log('RPC Result:', rpcResult);
        console.log('RPC Error:', rpcError);

        if (rpcError) {
          console.error('❌ RPC Error détaillé:', {
            message: rpcError.message,
            code: rpcError.code,
            details: rpcError.details,
            hint: rpcError.hint,
            fullError: JSON.stringify(rpcError)
          });
          
          // Messages explicites pour l'utilisateur
          if (rpcError.message?.includes('unknown parameter') || 
              rpcError.message?.includes('null value')) {
            toast.error('Erreur système. Veuillez contacter le support.');
          } else if (rpcError.message?.includes('Format email invalide')) {
            toast.error('Email invalide. Vérifiez le format.');
          } else if (rpcError.message?.includes('Format téléphone invalide')) {
            toast.error('Numéro de téléphone invalide (10-15 chiffres).');
          } else if (rpcError.message?.includes('Nom entreprise trop court')) {
            toast.error('Nom de l\'entreprise trop court (minimum 3 caractères).');
          } else {
            toast.error(rpcError.message || 'Erreur lors de la création du profil');
          }
          
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
      
      // ✅ SOLUTION 1 : Gestion utilisateur existant avec création de profil partenaire
      if (error.message === 'EXISTING_USER_DETECTED') {
        console.log('🔄 [PARTNER REG] Existing user detected, attempting sign-in:', data.contact_email);
        
        try {
          // Étape 1 : Connexion avec les credentials fournis
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: data.contact_email,
            password: data.password
          });

          if (loginError || !loginData.user) {
            console.error('❌ Login failed for existing user:', loginError);
            
            // ✅ Messages explicites selon le type d'erreur
            if (loginError?.message.includes('Invalid login credentials')) {
              toast.error('Mot de passe incorrect', {
                description: 'Cet email est déjà utilisé. Utilisez le mot de passe de votre compte existant ou réinitialisez-le.',
                duration: 6000
              });
            } else if (loginError?.message.includes('Email not confirmed')) {
              toast.error('Email non confirmé', {
                description: 'Veuillez confirmer votre email avant de vous connecter.',
                duration: 6000
              });
            } else {
              toast.error('Erreur de connexion', {
                description: loginError?.message || 'Vérifiez vos identifiants',
                duration: 6000
              });
            }
            
            return { 
              success: false, 
              error: 'AUTH_FAILED',
              suggestion: 'reset_password'
            };
          }

          console.log('✅ [PARTNER REG] Sign-in successful, checking for partner profile...');

          // Étape 2 : Vérifier si un profil partenaire existe déjà
          const { data: existingPartner, error: checkError } = await supabase
            .from('partenaires')
            .select('id')
            .eq('user_id', loginData.user.id)
            .maybeSingle();

          if (existingPartner) {
            console.log('⚠️ Partner profile already exists');
            toast.error('Vous êtes déjà inscrit comme partenaire.');
            return { success: false, error: 'PARTNER_ALREADY_EXISTS' };
          }

          console.log('📝 [PARTNER REG] No partner profile found, creating one...');

          // Étape 3 : Créer le profil partenaire pour l'utilisateur existant
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'create_partner_profile_secure',
            {
              p_user_id: loginData.user.id,
              p_email: data.contact_email,
              p_company_name: data.company_name,
              p_phone_number: data.phone,
              p_business_type: data.business_type,
              p_service_areas: data.service_areas,
              p_display_name: data.company_name,
              p_address: data.address || 'Kinshasa, RDC'
            }
          ) as { data: { success: boolean; error?: string; partner_id?: string } | null; error: any };

          if (rpcError || (rpcResult && !rpcResult.success)) {
            console.error('❌ Partner profile creation failed détaillé:', {
              rpcError: rpcError ? {
                message: rpcError.message,
                code: rpcError.code,
                details: rpcError.details,
                hint: rpcError.hint,
                fullError: JSON.stringify(rpcError)
              } : null,
              rpcResult: rpcResult?.error
            });
            
            // Messages explicites pour l'utilisateur
            if (rpcError?.message?.includes('unknown parameter') || 
                rpcError?.message?.includes('null value')) {
              toast.error('Erreur système. Veuillez contacter le support.');
            } else if (rpcError?.message?.includes('Format email invalide')) {
              toast.error('Email invalide. Vérifiez le format.');
            } else if (rpcError?.message?.includes('Format téléphone invalide')) {
              toast.error('Numéro de téléphone invalide (10-15 chiffres).');
            } else if (rpcError?.message?.includes('Nom entreprise trop court')) {
              toast.error('Nom de l\'entreprise trop court (minimum 3 caractères).');
            } else {
              toast.error(rpcResult?.error || 'Erreur lors de la création du profil partenaire');
            }
            
            return { success: false, error: 'PROFILE_CREATION_FAILED' };
          }

          console.log('✅ [PARTNER REG] Partner profile created successfully');

          // Notification admin (non-bloquante)
          try {
            await supabase.functions.invoke('smart-notification-dispatcher', {
              body: {
                type: 'partner_registration',
                data: {
                  partner_name: data.company_name,
                  business_type: data.business_type,
                  service_areas: data.service_areas,
                  email: data.contact_email,
                  user_id: loginData.user.id
                }
              }
            });
            console.log('📧 Admin notification sent');
          } catch (notifError) {
            console.warn('⚠️ Admin notification failed:', notifError);
          }

          toast.success('Profil partenaire créé avec succès !');
          return { 
            success: true, 
            user: loginData.user, 
            existingUser: true 
          };

        } catch (innerError: any) {
          console.error('❌ Error handling existing user:', innerError);
          toast.error('Erreur lors de la création du profil partenaire');
          return { success: false, error: innerError.message || 'UNKNOWN_ERROR' };
        }
      }
      
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