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
      // Créer la demande de chauffeur avec le nouveau système
      const { data: driverRequest, error: requestError } = await supabase
        .from('driver_requests')
        .insert({
          user_id: user.id,
          service_type: data.serviceType,
          license_number: data.licenseNumber || 'TEMP',
          license_expiry: data.licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          vehicle_type: data.vehicleType || 'car',
          vehicle_make: data.vehicleMake || 'Unknown',
          vehicle_model: data.vehicleModel || 'Unknown',
          vehicle_year: data.vehicleYear || new Date().getFullYear(),
          vehicle_plate: data.vehiclePlate || 'TEMP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          insurance_number: data.insuranceNumber || 'TEMP-INS',
          documents: data.documents || [],
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
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