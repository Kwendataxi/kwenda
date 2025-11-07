import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DriverRegistrationData {
  serviceCategory: 'taxi' | 'delivery';
  serviceType: string;
  serviceSpecialization?: string; // ✅ PHASE 2: Spécialisation exacte (taxi_moto, flash, etc.)
  displayName: string;
  phoneNumber: string;
  email: string; // Ajouté pour Supabase Auth
  password: string; // Ajouté pour Supabase Auth
  licenseNumber: string;
  licenseExpiry: string;
  vehicleType?: string; // Optionnel si pas de véhicule propre
  vehicleMake?: string; // Optionnel si pas de véhicule propre
  vehicleModel?: string; // Optionnel si pas de véhicule propre
  vehicleYear?: number; // Optionnel si pas de véhicule propre
  vehiclePlate?: string; // Optionnel si pas de véhicule propre
  vehicleColor?: string;
  insuranceNumber?: string; // Optionnel si pas de véhicule propre
  insuranceExpiry?: string;
  deliveryCapacity?: string;
  bankAccountNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  acceptsTerms: boolean;
  hasOwnVehicle: boolean; // Nouveau champ pour distinguer les modes
}

export const useDriverRegistration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerDriver = async (data: DriverRegistrationData) => {
    setIsRegistering(true);

    try {
      // 1. Validation simple côté client (RPC validation temporairement désactivée)
      console.log('🔍 Validation des données d\'inscription:', {
        email: data.email,
        phone: data.phoneNumber,
        license: data.licenseNumber,
        plate: data.hasOwnVehicle ? data.vehiclePlate : null
      });

      // Validation téléphone format congolais
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(data.phoneNumber.replace(/[\s\-]/g, ''))) {
        throw new Error('Format de téléphone invalide (ex: 0991234567)');
      }

      // Validation champs obligatoires (permis optionnel pour moto-taxi)
      if (!data.email || !data.displayName) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Permis obligatoire SAUF pour moto-taxi
      if (data.serviceType !== 'moto_taxi' && !data.licenseNumber) {
        throw new Error('Le numéro de permis est requis pour ce type de service');
      }

      console.log('✅ Validation réussie, création du compte...');

      // 2. Créer le compte Supabase Auth avec rôle normalisé
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/driver/verify-email`,
          data: {
            user_type: 'driver', // ✅ Standardisé : user_type au lieu de role
            display_name: data.displayName,
            phone_number: data.phoneNumber,
            license_number: data.licenseNumber,
            vehicle_plate: data.hasOwnVehicle ? data.vehiclePlate : null,
            service_type: data.serviceType
          }
        }
      });

      console.log('🔐 Résultat création compte Auth:', {
        hasUser: !!authData?.user,
        userId: authData?.user?.id,
        hasSession: !!authData?.session,
        sessionAccessToken: authData?.session ? 'présent' : 'absent',
        error: authError
      });

      // ✅ Sauvegarder l'intention de connexion pour redirection correcte
      localStorage.setItem('kwenda_login_intent', 'driver');
      localStorage.setItem('kwenda_selected_role', 'driver');

      if (authError) {
        console.error('❌ Erreur création compte:', authError);
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_phone_number: data.phoneNumber,
          p_license_number: data.licenseNumber,
          p_success: false,
          p_error_message: `Auth error: ${authError.message}`
        });
        throw authError;
      }

      if (!authData.user) {
        const errorMsg = 'Erreur lors de la création du compte';
        console.error('❌', errorMsg);
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_phone_number: data.phoneNumber,
          p_license_number: data.licenseNumber,
          p_success: false,
          p_error_message: errorMsg
        });
        throw new Error(errorMsg);
      }

      // ✅ AMÉLIORATION: Gérer cas avec et sans email confirmation
      if (!authData.session) {
        console.warn('⚠️ Aucune session immédiate - email confirmation requise');
        console.log('📧 Email de confirmation envoyé à:', data.email);
        
        // Stocker les données pour compléter l'inscription après confirmation
        localStorage.setItem('pendingDriverRegistration', JSON.stringify({
          email: data.email,
          display_name: data.displayName,
          phone_number: data.phoneNumber,
          license_number: data.licenseNumber,
          vehicle_plate: data.hasOwnVehicle ? data.vehiclePlate : null,
          service_type: data.serviceType,
          delivery_capacity: data.deliveryCapacity,
          vehicle_class: 'standard',
          has_own_vehicle: data.hasOwnVehicle
        }));
        
        toast({
          title: "Vérification email requise",
          description: "Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre compte et compléter votre inscription.",
        });

        return {
          success: true,
          hasOwnVehicle: data.hasOwnVehicle,
          redirectPath: '/driver/verify-email',
          user: authData.user,
          session: null,
          requiresEmailConfirmation: true
        };
      }

      console.log('✅ Session active détectée, userId:', authData.user.id);
      console.log('✅ Compte Auth créé, création profil via RPC...');

      // 3. Appeler la fonction RPC sécurisée pour créer le profil chauffeur
      console.log('🔧 Appel RPC create_driver_profile_secure avec params:', {
        userId: authData.user.id,
        email: data.email,
        hasOwnVehicle: data.hasOwnVehicle
      });

      let rpcResult: { success: boolean; error?: string; driver_id?: string } | null = null;
      let rpcError: any = null;

      try {
        const response = await supabase.rpc(
          'create_driver_profile_secure',
          {
            p_user_id: authData.user.id,
            p_email: data.email,
            p_display_name: data.displayName,
            p_phone_number: data.phoneNumber,
            p_license_number: data.licenseNumber || null,
            p_vehicle_plate: data.hasOwnVehicle ? data.vehiclePlate : null,
            p_service_type: data.serviceType || null,
            p_delivery_capacity: data.deliveryCapacity || null,
            p_vehicle_class: 'standard',
            p_has_own_vehicle: data.hasOwnVehicle
          }
        ) as { data: { success: boolean; error?: string; driver_id?: string } | null; error: any };

        rpcResult = response.data;
        rpcError = response.error;

        console.log('📊 RPC Response:', {
          hasData: !!rpcResult,
          success: rpcResult?.success,
          hasError: !!rpcError,
          errorMessage: rpcError?.message,
          errorCode: rpcError?.code,
          errorDetails: rpcError?.details
        });
      } catch (rpcCallError: any) {
        console.error('❌ Exception lors de l\'appel RPC:', rpcCallError);
        rpcError = rpcCallError;
      }

      // ✅ PHASE 2: Fallback amélioré en cas d'échec RPC
      if (rpcError) {
        console.error('❌ RPC Error détaillé:', {
          message: rpcError.message,
          code: rpcError.code,
          details: rpcError.details,
          hint: rpcError.hint
        });

        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_phone_number: data.phoneNumber,
          p_license_number: data.licenseNumber,
          p_success: false,
          p_error_message: `RPC error: ${rpcError.message} (code: ${rpcError.code})`
        });

        // Tenter de supprimer le compte auth orphelin
        console.log('🗑️ Tentative de nettoyage du compte auth orphelin...');
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('✅ Compte auth orphelin supprimé');
        } catch (deleteError) {
          console.warn('⚠️ Impossible de supprimer le compte auth:', deleteError);
        }

        toast({
          title: "Erreur technique",
          description: `Impossible de créer votre profil chauffeur. Détails: ${rpcError.message}. Veuillez contacter le support si le problème persiste.`,
          variant: "destructive",
        });

        throw new Error(`Erreur RPC: ${rpcError.message || 'Erreur inconnue lors de la création du profil'}`);
      }

      if (rpcResult && !rpcResult.success) {
        console.error('❌ Driver creation failed:', rpcResult.error);
        
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_phone_number: data.phoneNumber,
          p_license_number: data.licenseNumber,
          p_success: false,
          p_error_message: rpcResult.error || 'RPC returned success=false'
        });

        // Tenter de supprimer le compte auth orphelin
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('✅ Compte auth orphelin supprimé');
        } catch (deleteError) {
          console.warn('⚠️ Impossible de supprimer le compte auth:', deleteError);
        }

        toast({
          title: "Erreur lors de la création du profil",
          description: rpcResult.error || "Impossible de créer votre profil. Veuillez réessayer.",
          variant: "destructive",
        });

        throw new Error(rpcResult.error || 'Erreur lors de la création du profil chauffeur');
      }

      console.log('✅ Profil chauffeur créé via RPC, driver_id:', rpcResult?.driver_id);

      // 4. Mettre à jour le profil avec les détails complets qui ne sont pas dans la fonction RPC
      const updateData: any = {
        license_expiry: data.licenseExpiry,
        bank_account_number: data.bankAccountNumber,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        service_specialization: data.serviceSpecialization || null // ✅ PHASE 2: Ajouter la spécialisation
      };

      // Ajouter les infos véhicule seulement si le chauffeur a son propre véhicule
      if (data.hasOwnVehicle) {
        updateData.vehicle_type = data.vehicleType;
        updateData.vehicle_make = data.vehicleMake;
        updateData.vehicle_model = data.vehicleModel;
        updateData.vehicle_year = data.vehicleYear;
        updateData.vehicle_color = data.vehicleColor;
        updateData.insurance_number = data.insuranceNumber;
        updateData.insurance_expiry = data.insuranceExpiry;
      }

      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update(updateData)
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour détails chauffeur:', updateError);
      } else {
        console.log('✅ Détails chauffeur mis à jour');
      }

      // 5. Créer la demande de chauffeur
      const requestData: any = {
        user_id: authData.user.id,
        service_type: data.serviceType,
        license_number: data.licenseNumber,
        license_expiry: data.licenseExpiry,
        documents: [],
        status: 'pending',
        has_own_vehicle: data.hasOwnVehicle, // Ajout du flag véhicule propre
      };

      // Ajouter les infos véhicule seulement si le chauffeur a son propre véhicule
      if (data.hasOwnVehicle) {
        requestData.vehicle_type = data.vehicleType;
        requestData.vehicle_model = data.vehicleModel;
        requestData.vehicle_year = data.vehicleYear;
        requestData.vehicle_plate = data.vehiclePlate;
        requestData.insurance_number = data.insuranceNumber;
      }

      const { error: requestError } = await supabase
        .from('driver_requests')
        .insert(requestData);

      if (requestError) {
        console.warn('Could not create driver request:', requestError);
      }

      // 6. Créer les préférences de service
      const { error: preferencesError } = await supabase
        .from('driver_service_preferences')
        .upsert({
          driver_id: authData.user.id,
          service_types: [data.serviceType],
          vehicle_classes: ['standard'],
          preferred_zones: ['Kinshasa'],
          is_active: true,
        });

      if (preferencesError) {
        console.warn('Could not create service preferences:', preferencesError);
      }

      // Log successful registration
      await supabase.rpc('log_driver_registration_attempt', {
        p_email: data.email,
        p_phone_number: data.phoneNumber,
        p_license_number: data.licenseNumber,
        p_success: true,
        p_error_message: null
      });

      console.log('✅ Inscription complète réussie!');

      toast({
        title: "Inscription réussie !",
        description: "Votre compte a été créé avec succès. Vérifiez votre email pour confirmer votre adresse.",
      });

      return { 
        success: true, 
        hasOwnVehicle: data.hasOwnVehicle,
        redirectPath: data.hasOwnVehicle ? '/dashboard' : '/driver/find-partner',
        user: authData.user,
        session: authData.session
      };
    } catch (error: any) {
      console.error('Driver registration error:', error);
      
      // Log the error if not already logged
      try {
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email || 'unknown',
          p_phone_number: data.phoneNumber || 'unknown',
          p_license_number: data.licenseNumber || 'unknown',
          p_success: false,
          p_error_message: `Unexpected error: ${error.message || 'Unknown error'}`
        });
      } catch (logError) {
        console.warn('Failed to log registration error:', logError);
      }
      
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerDriver,
    isRegistering,
  };
};