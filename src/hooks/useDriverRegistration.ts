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
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehicleColor?: string;
  insuranceNumber: string;
  insuranceExpiry?: string;
  deliveryCapacity?: string;
  bankAccountNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  acceptsTerms: boolean;
}

export const useDriverRegistration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerDriver = async (data: DriverRegistrationData) => {
    setIsRegistering(true);

    try {
      // 1. Valider les données avant l'inscription avec la nouvelle fonction
      const { data: validation, error: validationError } = await supabase.rpc('validate_driver_registration_data', {
        p_email: data.email,
        p_phone: data.phoneNumber,
        p_license_number: data.licenseNumber,
        p_vehicle_plate: data.vehiclePlate
      });

      if (validationError) {
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_success: false,
          p_error_message: `Validation error: ${validationError.message}`
        });
        throw validationError;
      }

      if (validation && typeof validation === 'object' && 'valid' in validation && !(validation as any).valid) {
        const errors = (validation as any).errors || [];
        const errorMessage = Array.isArray(errors) ? errors.join(', ') : 'Erreur de validation';
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_success: false,
          p_error_message: errorMessage
        });
        throw new Error(errorMessage);
      }

      // 2. Créer le compte Supabase Auth avec métadonnées
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: 'driver',
            service_category: data.serviceCategory,
            display_name: data.displayName,
            phone_number: data.phoneNumber,
          }
        }
      });

      if (authError) {
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_success: false,
          p_error_message: `Auth error: ${authError.message}`
        });
        throw authError;
      }

      if (!authData.user) {
        const errorMsg = 'Erreur lors de la création du compte';
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email,
          p_success: false,
          p_error_message: errorMsg
        });
        throw new Error(errorMsg);
      }

      // 3. Le trigger handle_new_driver() va automatiquement créer le profil chauffeur
      // Attendre un peu pour que le trigger s'exécute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Mettre à jour le profil avec les détails complets
      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update({
          display_name: data.displayName,
          phone_number: data.phoneNumber,
          license_number: data.licenseNumber,
          license_expiry: data.licenseExpiry,
          vehicle_type: data.vehicleType,
          vehicle_make: data.vehicleMake,
          vehicle_model: data.vehicleModel,
          vehicle_year: data.vehicleYear,
          vehicle_plate: data.vehiclePlate,
          vehicle_color: data.vehicleColor,
          insurance_number: data.insuranceNumber,
          insurance_expiry: data.insuranceExpiry,
          delivery_capacity: data.deliveryCapacity,
          bank_account_number: data.bankAccountNumber,
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_phone: data.emergencyContactPhone,
          verification_status: 'pending',
          is_active: false, // Désactivé jusqu'à vérification
          role: data.serviceCategory === 'taxi' ? 'chauffeur' : 'livreur',
          service_type: data.serviceType,
          vehicle_class: 'standard'
        })
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.warn('Could not update driver profile:', updateError);
      }

      // 5. Créer la demande de chauffeur
      const { error: requestError } = await supabase
        .from('driver_requests')
        .insert({
          user_id: authData.user.id,
          service_type: data.serviceType,
          license_number: data.licenseNumber,
          license_expiry: data.licenseExpiry,
          vehicle_type: data.vehicleType,
          vehicle_make: data.vehicleMake,
          vehicle_model: data.vehicleModel,
          vehicle_year: data.vehicleYear,
          vehicle_plate: data.vehiclePlate,
          insurance_number: data.insuranceNumber,
          documents: [],
          status: 'pending',
        });

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
        p_success: true,
        p_error_message: null
      });

      toast({
        title: "Inscription réussie !",
        description: "Votre compte a été créé avec succès. Vérifiez votre email pour confirmer votre adresse.",
      });

      return authData;
    } catch (error: any) {
      console.error('Driver registration error:', error);
      
      // Log the error if not already logged
      try {
        await supabase.rpc('log_driver_registration_attempt', {
          p_email: data.email || 'unknown',
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