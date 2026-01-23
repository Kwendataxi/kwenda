import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Briefcase, Car, User as UserIcon, CreditCard, FileCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SpecificServiceSelector } from './SpecificServiceSelector';
import { VehicleTypeSelector } from './VehicleTypeSelector';
import { VehicleOwnershipSelector } from '@/components/auth/VehicleOwnershipSelector';
import { ServiceSpecializationSelector } from './ServiceSpecializationSelector';
import { PersonalInfoStep } from './PersonalInfoStep';
import { LicenseStep } from './LicenseStep';
import { SubscriptionPlanStep } from './SubscriptionPlanStep';
import { SummaryStep } from './SummaryStep';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreamlinedDriverRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
}

type RegistrationStep = 'service' | 'vehicle' | 'specialization' | 'personal' | 'license' | 'subscription' | 'summary';

interface FormData {
  // Personal
  displayName: string;
  email: string;
  phoneNumber: string;
  password: string;
  referralCode?: string;
  
  // Service
  serviceCategory: 'taxi' | 'delivery';
  serviceType: string;
  serviceSpecialization?: string; // Nouvelle spécialisation (taxi_moto, flash, etc.)
  deliveryCapacity?: string;
  
  // Vehicle
  hasOwnVehicle: boolean;
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePlate?: string;
  vehicleColor?: string;
  insuranceNumber?: string;
  
  // License
  licenseNumber: string;
  licenseExpiry: string;
  
  // Emergency
  emergencyContactName: string;
  emergencyContactPhone: string;
  
  // Subscription
  selectedPlanId: string | null;
  
  // Terms
  acceptTerms: boolean;
}

export const StreamlinedDriverRegistration: React.FC<StreamlinedDriverRegistrationProps> = ({
  onBack,
  onSuccess
}) => {
  const [step, setStep] = useState<RegistrationStep>('service');
  const [serviceCategory, setServiceCategory] = useState<'taxi' | 'delivery'>('taxi');
  const [vehicleMode, setVehicleMode] = useState<'own' | 'partner' | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    referralCode: '',
    serviceCategory: 'taxi',
    serviceType: '',
    hasOwnVehicle: false,
    licenseNumber: '',
    licenseExpiry: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    selectedPlanId: null,
    acceptTerms: false
  });

  const { registerDriver, isRegistering } = useDriverRegistration();

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceSelect = (serviceType: string) => {
    handleFieldChange('serviceType', serviceType);
  };

  const handleVehicleModeSelect = (mode: 'own' | 'partner') => {
    setVehicleMode(mode);
    handleFieldChange('hasOwnVehicle', mode === 'own');
  };

  const handleVehicleTypeSelect = (type: string) => {
    handleFieldChange('vehicleType', type);
  };

  const validateStep = (currentStep: RegistrationStep): boolean => {
    if (currentStep === 'service') {
      if (!formData.serviceType) {
        toast.error('Veuillez sélectionner un type de service');
        return false;
      }
      return true;
    }
    
    if (currentStep === 'vehicle') {
      if (vehicleMode === null) {
        toast.error('Veuillez choisir votre mode de véhicule');
        return false;
      }
      // vehicleType obligatoire SEULEMENT si mode 'own'
      if (vehicleMode === 'own' && !formData.vehicleType) {
        toast.error('Veuillez sélectionner le type de véhicule');
        return false;
      }
      // Mode 'partner' valide sans vehicleType
      return true;
    }
    
    if (currentStep === 'specialization') {
      // Spécialisation obligatoire si le chauffeur a son propre véhicule
      if (vehicleMode === 'own' && !formData.serviceSpecialization) {
        toast.error('Veuillez choisir votre spécialisation');
        return false;
      }
      return true;
    }

    if (currentStep === 'personal') {
      if (!formData.displayName || !formData.email || !formData.phoneNumber || !formData.password) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return false;
      }
      return true;
    }

    if (currentStep === 'license') {
      // Permis optionnel pour moto-taxi
      if (formData.serviceType === 'moto_taxi') {
        return true; // Toujours valide pour moto-taxi
      }
      if (!formData.licenseNumber) {
        toast.error('Le numéro de permis de conduire est requis pour ce type de service');
        return false;
      }
      return true;
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    
    if (step === 'service') setStep('vehicle');
    else if (step === 'vehicle') {
      // Si le chauffeur a son propre véhicule, on demande sa spécialisation
      if (vehicleMode === 'own') setStep('specialization');
      else setStep('personal'); // Sinon, on passe directement aux infos personnelles
    }
    else if (step === 'specialization') setStep('personal');
    else if (step === 'personal') setStep('license');
    else if (step === 'license') setStep('subscription');
    else if (step === 'subscription') setStep('summary');
  };

  const handleBack = () => {
    if (step === 'service') onBack();
    else if (step === 'vehicle') setStep('service');
    else if (step === 'specialization') setStep('vehicle');
    else if (step === 'personal') {
      // Revenir à spécialisation si mode 'own', sinon à vehicle
      if (vehicleMode === 'own') setStep('specialization');
      else setStep('vehicle');
    }
    else if (step === 'license') setStep('personal');
    else if (step === 'subscription') setStep('license');
    else if (step === 'summary') setStep('subscription');
  };

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      toast.error('Veuillez accepter les conditions générales');
      return;
    }

    try {
      const result = await registerDriver({
        displayName: formData.displayName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        serviceCategory,
        serviceType: formData.serviceType,
        serviceSpecialization: formData.serviceSpecialization, // ✅ Nouvelle spécialisation
        deliveryCapacity: formData.deliveryCapacity,
        hasOwnVehicle: formData.hasOwnVehicle,
        vehicleType: formData.vehicleType,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear,
        vehiclePlate: formData.vehiclePlate,
        vehicleColor: formData.vehicleColor,
        insuranceNumber: formData.insuranceNumber,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        acceptsTerms: formData.acceptTerms
      });

      if (result.success) {
        // Appliquer code de parrainage si fourni
        if (formData.referralCode && formData.referralCode.trim() !== '') {
          const { data: refResult, error: refError } = await supabase.rpc(
            'apply_referral_code',
            {
              p_referee_id: result.user?.id,
              p_referral_code: formData.referralCode.trim().toUpperCase()
            }
          );

          if (!refError && (refResult as any)?.success) {
            toast.success('🎉 Bonus de parrainage reçu : 500 CDF !');
          }
        }

        // ✅ CORRECTION: Stocker temporairement le service_type et rediriger vers l'espace chauffeur
        localStorage.setItem('kwenda_driver_service_type', serviceCategory);
        toast.success('Inscription réussie ! Bienvenue sur Kwenda 🎉');
        
        // Rediriger vers l'espace chauffeur au lieu de onSuccess()
        window.location.href = '/app/chauffeur';
      }
    } catch (error: any) {
      console.error('❌ Registration Error:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  const getStepTitle = () => {
    if (step === 'service') return 'Choisissez votre Service';
    if (step === 'vehicle') return 'Configuration du Véhicule';
    if (step === 'specialization') return 'Votre Spécialisation';
    if (step === 'personal') return 'Informations Personnelles';
    if (step === 'license') return 'Permis de Conduire';
    if (step === 'subscription') return 'Plan d\'Abonnement';
    return 'Récapitulatif';
  };

  const getStepSubtitle = () => {
    if (step === 'service') return 'Sélectionnez le service que vous souhaitez offrir';
    if (step === 'vehicle') return 'Configurez votre véhicule de travail';
    if (step === 'specialization') return 'Choisissez le type exact de service que vous voulez offrir';
    if (step === 'personal') return 'Complétez vos informations personnelles';
    if (step === 'license') return 'Ajoutez vos informations de permis';
    if (step === 'subscription') return 'Découvrez notre modèle sans commission';
    return 'Vérifiez vos informations avant de soumettre';
  };

  const getCurrentStepNumber = () => {
    const stepMap: Record<RegistrationStep, number> = {
      service: 1,
      vehicle: 2,
      specialization: 2.5, // Entre vehicle et personal
      personal: 3,
      license: 4,
      subscription: 5,
      summary: 6
    };
    return stepMap[step];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Modern Progress Header */}
      <div className="relative mb-8">
        {/* Barre de progression visuelle */}
        <div className="flex items-center justify-between mb-6">
          {[
            { step: 1, label: 'Service', icon: Briefcase },
            { step: 2, label: 'Véhicule', icon: Car },
            { step: 3, label: 'Infos', icon: UserIcon },
            { step: 4, label: 'Permis', icon: FileCheck },
            { step: 5, label: 'Abonnement', icon: CreditCard }
          ].map((item, idx) => (
            <div key={item.step} className="flex items-center flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                getCurrentStepNumber() >= item.step
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
              )}>
                {getCurrentStepNumber() > item.step ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <item.icon className="w-5 h-5" />
                )}
              </div>
              {idx < 4 && (
                <div className={cn(
                  "h-1 flex-1 mx-2 rounded-full transition-all",
                  getCurrentStepNumber() > item.step
                    ? "bg-gradient-to-r from-amber-500 to-orange-600"
                    : "bg-zinc-200 dark:bg-zinc-700"
                )} />
              )}
            </div>
          ))}
        </div>
        
        {/* Titre avec animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {getStepTitle()}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {getStepSubtitle()}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Service Category Tabs */}
      {step === 'service' && (
        <div className="flex gap-4 p-1 bg-muted/50 dark:bg-muted/30 rounded-lg">
          <button
            onClick={() => {
              setServiceCategory('taxi');
              handleFieldChange('serviceCategory', 'taxi');
              handleFieldChange('serviceType', '');
            }}
            className={cn(
              "flex-1 py-3 px-4 rounded-md font-medium transition-all",
              serviceCategory === 'taxi'
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground dark:hover:bg-muted/50"
            )}
          >
            🚖 Transport VTC
          </button>
          <button
            onClick={() => {
              setServiceCategory('delivery');
              handleFieldChange('serviceCategory', 'delivery');
              handleFieldChange('serviceType', '');
            }}
            className={cn(
              "flex-1 py-3 px-4 rounded-md font-medium transition-all",
              serviceCategory === 'delivery'
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground dark:hover:bg-muted/50"
            )}
          >
            📦 Livraison
          </button>
        </div>
      )}

      <Card className="dark:bg-card/95 dark:border-border/60">
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Service Selection */}
            {step === 'service' && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SpecificServiceSelector
                  serviceCategory={serviceCategory}
                  selectedService={formData.serviceType}
                  onServiceSelect={handleServiceSelect}
                />
              </motion.div>
            )}

            {/* STEP 2: Vehicle Configuration */}
            {step === 'vehicle' && (
              <motion.div
                key="vehicle"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!vehicleMode ? (
                  <VehicleOwnershipSelector
                    selectedMode={vehicleMode}
                    onModeSelect={handleVehicleModeSelect}
                    serviceCategory={serviceCategory}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
                      <Check className="h-5 w-5 text-primary" />
                      <span className="text-sm dark:text-foreground">
                        {vehicleMode === 'own' ? 'Vous avez votre propre véhicule' : 'Vous cherchez un partenaire'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVehicleMode(null)}
                        className="ml-auto dark:text-muted-foreground dark:hover:bg-muted/50"
                      >
                        Modifier
                      </Button>
                    </div>

                    {vehicleMode === 'own' && (
                      <VehicleTypeSelector
                        serviceCategory={serviceCategory}
                        selectedType={formData.vehicleType || null}
                        onTypeSelect={handleVehicleTypeSelect}
                      />
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 2.5: Service Specialization */}
            {step === 'specialization' && (
              <motion.div
                key="specialization"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ServiceSpecializationSelector
                  serviceCategory={serviceCategory}
                  vehicleType={formData.vehicleType || ''}
                  selectedSpecialization={formData.serviceSpecialization || null}
                  onSpecializationSelect={(spec) => handleFieldChange('serviceSpecialization', spec)}
                />
              </motion.div>
            )}

            {/* STEP 3: Personal Info */}
            {step === 'personal' && (
              <PersonalInfoStep
                formData={formData}
                onFieldChange={handleFieldChange}
              />
            )}

            {/* STEP 4: License */}
            {step === 'license' && (
              <LicenseStep
                formData={formData}
                onFieldChange={handleFieldChange}
              />
            )}

            {/* STEP 5: Subscription */}
            {step === 'subscription' && (
              <SubscriptionPlanStep
                selectedPlan={formData.selectedPlanId}
                onPlanSelect={(planId) => handleFieldChange('selectedPlanId', planId)}
              />
            )}

            {/* STEP 6: Summary */}
            {step === 'summary' && (
              <SummaryStep
                formData={formData}
                onFieldChange={handleFieldChange}
                onBack={handleBack}
                onSubmit={handleSubmit}
                isRegistering={isRegistering}
              />
            )}
          </AnimatePresence>

          {/* Action Buttons - Only for steps before summary */}
          {step !== 'summary' && (
            <div className="flex gap-4 pt-6 mt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={
                  (step === 'service' && !formData.serviceType) ||
                  (step === 'vehicle' && (!vehicleMode || (vehicleMode === 'own' && !formData.vehicleType))) ||
                  (step === 'specialization' && !formData.serviceSpecialization)
                }
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 font-semibold"
              >
                Continuer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
