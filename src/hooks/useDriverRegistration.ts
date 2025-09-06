import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DriverRegistrationData {
  serviceCategory: 'taxi' | 'delivery';
  serviceType: string;
  [key: string]: any;
}

export const useDriverRegistration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerDriver = async (data: DriverRegistrationData) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsRegistering(true);

    try {
        // Créer la demande de chauffeur avec les données réelles
      const { data: driverRequest, error: requestError } = await supabase
        .from('driver_requests')
        .insert({
          user_id: user.id,
          service_type: data.serviceType,
          license_number: data.licenseNumber,
          license_expiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString().split('T')[0] : null,
          vehicle_type: data.serviceCategory === 'taxi' ? 'car' : 'delivery',
          vehicle_make: data.vehicleMake,
          vehicle_model: data.vehicleModel,
          vehicle_year: data.vehicleYear,
          vehicle_plate: data.vehiclePlate,
          insurance_number: data.insuranceNumber,
          documents: {
            hasProfilePhoto: data.hasProfilePhoto || false,
            hasLicensePhoto: data.hasLicensePhoto || false,
            hasVehiclePhoto: data.hasVehiclePhoto || false,
            hasInsuranceDoc: data.hasInsuranceDoc || false,
            personalData: {
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: data.dateOfBirth,
              phone: data.phone,
              address: data.address,
              emergencyContactName: data.emergencyContactName,
              emergencyContactPhone: data.emergencyContactPhone,
            }
          },
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

        // Mettre à jour le profil chauffeur avec les données personnelles
      const { error: profileError } = await supabase
        .from('chauffeurs')
        .update({
          display_name: `${data.firstName} ${data.lastName}`,
          phone_number: data.phone,
          license_number: data.licenseNumber,
          license_expiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString().split('T')[0] : null,
          vehicle_type: data.serviceCategory === 'taxi' ? 'car' : 'delivery',
          vehicle_model: data.vehicleModel,
          vehicle_year: data.vehicleYear,
          vehicle_plate: data.vehiclePlate,
          vehicle_color: data.vehicleColor,
          insurance_number: data.insuranceNumber,
          insurance_expiry: data.insuranceExpiry ? new Date(data.insuranceExpiry).toISOString().split('T')[0] : null,
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_phone: data.emergencyContactPhone,
          verification_status: 'pending'
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.warn('Could not update driver profile:', profileError);
      }

      // Créer ou mettre à jour les préférences de service
      const { error: preferencesError } = await supabase
        .from('driver_service_preferences')
        .upsert({
          driver_id: user.id,
          service_types: [data.serviceType],
          vehicle_classes: ['standard'],
          preferred_zones: ['Kinshasa'],
          is_active: true,
        });

      if (preferencesError) {
        console.warn('Could not create service preferences:', preferencesError);
      }

      toast({
        title: "Inscription soumise",
        description: "Votre demande d'inscription a été soumise avec succès. Vous recevrez une confirmation sous peu.",
      });

      return driverRequest;
    } catch (error) {
      console.error('Driver registration error:', error);
      toast({
        title: "Erreur d'inscription",
        description: "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
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