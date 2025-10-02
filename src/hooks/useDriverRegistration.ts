import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DriverRegistrationData {
  serviceCategory: 'taxi' | 'delivery';
  serviceType: string;
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
      // 1. Valider les données avant l'inscription avec la nouvelle fonction
      console.log('🔍 Validation des données d\'inscription:', {
        email: data.email,
        phone: data.phoneNumber,
        license: data.licenseNumber,
        plate: data.hasOwnVehicle ? data.vehiclePlate : null
      });

      const { data: validation, error: validationError } = await supabase.rpc('validate_driver_registration_data', {
        p_email: data.email,
        p_phone_number: data.phoneNumber,
        p_license_number: data.licenseNumber,
        p_vehicle_plate: data.hasOwnVehicle ? data.vehiclePlate : null
      });

      if (validationError) {
        console.error('❌ Erreur validation RPC:', validationError);
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_phone_number: data.phoneNumber,
          p_license_number: data.licenseNumber,
          p_success: false,
          p_error_message: `Validation error: ${validationError.message}`
        });
        throw validationError;
      }

      if (validation && typeof validation === 'object' && 'valid' in validation && !(validation as any).valid) {
        const errors = (validation as any).errors || [];
        const errorMessage = Array.isArray(errors) ? errors.join(', ') : 'Erreur de validation';
        console.warn('⚠️ Validation échouée:', errors);
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_phone_number: data.phoneNumber,
          p_license_number: data.licenseNumber,
          p_success: false,
          p_error_message: errorMessage
        });
        throw new Error(errorMessage);
      }

      console.log('✅ Validation réussie, création du compte...');

      // 2. Créer le compte Supabase Auth avec TOUTES les métadonnées
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            // Métadonnées utilisées par le trigger handle_new_driver()
            role: 'driver',
            service_category: data.serviceCategory,
            display_name: data.displayName,
            phone_number: data.phoneNumber,
            // Données complémentaires pour update ultérieur
            license_number: data.licenseNumber,
            license_expiry: data.licenseExpiry,
            has_own_vehicle: data.hasOwnVehicle,
            service_type: data.serviceType,
            vehicle_type: data.hasOwnVehicle ? data.vehicleType : null,
            vehicle_make: data.hasOwnVehicle ? data.vehicleMake : null,
            vehicle_model: data.hasOwnVehicle ? data.vehicleModel : null,
            vehicle_plate: data.hasOwnVehicle ? data.vehiclePlate : null,
          }
        }
      });

      console.log('🔐 Résultat création compte Auth:', {
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        error: authError
      });

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

      console.log('✅ Compte Auth créé, mise à jour profil chauffeur...');

      // 3. Le trigger handle_new_driver() va automatiquement créer le profil chauffeur
      // Attendre un peu pour que le trigger s'exécute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Mettre à jour le profil avec les détails complets
      const updateData: any = {
        display_name: data.displayName,
        phone_number: data.phoneNumber,
        license_number: data.licenseNumber,
        license_expiry: data.licenseExpiry,
        delivery_capacity: data.deliveryCapacity,
        bank_account_number: data.bankAccountNumber,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        verification_status: 'pending',
        is_active: data.hasOwnVehicle, // Actif seulement si véhicule propre
        role: data.serviceCategory === 'taxi' ? 'chauffeur' : 'livreur',
        service_type: data.serviceType,
        vehicle_class: 'standard',
        has_own_vehicle: data.hasOwnVehicle
      };

      // Ajouter les infos véhicule seulement si le chauffeur a son propre véhicule
      if (data.hasOwnVehicle) {
        updateData.vehicle_type = data.vehicleType;
        updateData.vehicle_make = data.vehicleMake;
        updateData.vehicle_model = data.vehicleModel;
        updateData.vehicle_year = data.vehicleYear;
        updateData.vehicle_plate = data.vehiclePlate;
        updateData.vehicle_color = data.vehicleColor;
        updateData.insurance_number = data.insuranceNumber;
        updateData.insurance_expiry = data.insuranceExpiry;
      }

      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update(updateData)
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour chauffeur:', updateError);
      } else {
        console.log('✅ Profil chauffeur mis à jour');
      }

      // 5. Créer la demande de chauffeur
      const requestData: any = {
        user_id: authData.user.id,
        service_type: data.serviceType,
        license_number: data.licenseNumber,
        license_expiry: data.licenseExpiry,
        documents: [],
        status: 'pending',
      };

      // Ajouter les infos véhicule seulement si le chauffeur a son propre véhicule
      if (data.hasOwnVehicle) {
        requestData.vehicle_type = data.vehicleType;
        requestData.vehicle_make = data.vehicleMake;
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