import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Check } from 'lucide-react';
import { SpecificServiceSelector } from './SpecificServiceSelector';
import { VehicleTypeSelector } from './VehicleTypeSelector';
import { VehicleOwnershipSelector } from '@/components/auth/VehicleOwnershipSelector';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { toast } from 'sonner';

interface StreamlinedDriverRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
}

type RegistrationStep = 'service' | 'vehicle' | 'details';

interface FormData {
  // Personal
  displayName: string;
  email: string;
  phoneNumber: string;
  password: string;
  
  // Service
  serviceCategory: 'taxi' | 'delivery';
  serviceType: string;
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
    serviceCategory: 'taxi',
    serviceType: '',
    hasOwnVehicle: false,
    licenseNumber: '',
    licenseExpiry: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    acceptTerms: false
  });

  const { registerDriver, isRegistering } = useDriverRegistration();

  const handleFieldChange = (field: keyof FormData, value: any) => {
    console.log(`📝 Field Changed: ${field} =`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceSelect = (serviceType: string) => {
    console.log('✅ Service Selected:', serviceType);
    handleFieldChange('serviceType', serviceType);
  };

  const handleVehicleModeSelect = (mode: 'own' | 'partner') => {
    console.log('🚗 Vehicle Mode:', mode);
    setVehicleMode(mode);
    handleFieldChange('hasOwnVehicle', mode === 'own');
  };

  const handleVehicleTypeSelect = (type: string) => {
    console.log('🚙 Vehicle Type:', type);
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
      if (vehicleMode === 'own' && !formData.vehicleType) {
        toast.error('Veuillez sélectionner le type de véhicule');
        return false;
      }
      return true;
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    
    if (step === 'service') setStep('vehicle');
    else if (step === 'vehicle') setStep('details');
  };

  const handleSubmit = async () => {
    console.log('🚀 Submitting Registration:', formData);
    
    if (!formData.displayName || !formData.email || !formData.phoneNumber || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (!formData.licenseNumber) {
      toast.error('Le numéro de permis de conduire est requis');
      return;
    }
    
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
        toast.success('Inscription réussie !');
        onSuccess();
      }
    } catch (error: any) {
      console.error('❌ Registration Error:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  const getStepTitle = () => {
    if (step === 'service') return 'Choisissez votre Service';
    if (step === 'vehicle') return 'Configuration du Véhicule';
    return 'Informations Personnelles';
  };

  const getStepNumber = () => {
    if (step === 'service') return '1/3';
    if (step === 'vehicle') return '2/3';
    return '3/3';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            if (step === 'service') onBack();
            else if (step === 'vehicle') setStep('service');
            else setStep('vehicle');
          }}
          className="dark:text-foreground dark:hover:bg-muted/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
          Étape {getStepNumber()}
        </div>
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
                ? "bg-primary text-primary-foreground shadow-sm"
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
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground dark:hover:bg-muted/50"
            )}
          >
            📦 Livraison
          </button>
        </div>
      )}

      <Card className="dark:bg-card/95 dark:border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl dark:text-foreground">{getStepTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* STEP 1: Service Selection */}
          {step === 'service' && (
            <SpecificServiceSelector
              serviceCategory={serviceCategory}
              selectedService={formData.serviceType}
              onServiceSelect={handleServiceSelect}
            />
          )}

          {/* STEP 2: Vehicle Configuration */}
          {step === 'vehicle' && (
            <div className="space-y-6">
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
            </div>
          )}

          {/* STEP 3: Personal Details */}
          {step === 'details' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg dark:text-foreground">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName" className="dark:text-foreground">Nom complet *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleFieldChange('displayName', e.target.value)}
                      placeholder="Jean Dupont"
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="dark:text-foreground">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="jean@example.com"
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="dark:text-foreground">Téléphone *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                      placeholder="+243 XX XXX XXXX"
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="dark:text-foreground">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg dark:text-foreground">Permis de Conduire</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber" className="dark:text-foreground">Numéro de Permis *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                      placeholder="ABC123456"
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseExpiry" className="dark:text-foreground">Date d'Expiration</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) => handleFieldChange('licenseExpiry', e.target.value)}
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Details (if own vehicle) */}
              {formData.hasOwnVehicle && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg dark:text-foreground">Détails du Véhicule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleMake" className="dark:text-foreground">Marque</Label>
                      <Input
                        id="vehicleMake"
                        value={formData.vehicleMake || ''}
                        onChange={(e) => handleFieldChange('vehicleMake', e.target.value)}
                        placeholder="Toyota"
                        className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel" className="dark:text-foreground">Modèle</Label>
                      <Input
                        id="vehicleModel"
                        value={formData.vehicleModel || ''}
                        onChange={(e) => handleFieldChange('vehicleModel', e.target.value)}
                        placeholder="Corolla"
                        className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleYear" className="dark:text-foreground">Année</Label>
                      <Input
                        id="vehicleYear"
                        type="number"
                        value={formData.vehicleYear || ''}
                        onChange={(e) => handleFieldChange('vehicleYear', parseInt(e.target.value))}
                        placeholder="2020"
                        className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehiclePlate" className="dark:text-foreground">Plaque d'Immatriculation</Label>
                      <Input
                        id="vehiclePlate"
                        value={formData.vehiclePlate || ''}
                        onChange={(e) => handleFieldChange('vehiclePlate', e.target.value)}
                        placeholder="KIN-123-AB"
                        className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleColor" className="dark:text-foreground">Couleur</Label>
                      <Input
                        id="vehicleColor"
                        value={formData.vehicleColor || ''}
                        onChange={(e) => handleFieldChange('vehicleColor', e.target.value)}
                        placeholder="Blanc"
                        className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insuranceNumber" className="dark:text-foreground">Numéro d'Assurance</Label>
                      <Input
                        id="insuranceNumber"
                        value={formData.insuranceNumber || ''}
                        onChange={(e) => handleFieldChange('insuranceNumber', e.target.value)}
                        placeholder="ASS123456"
                        className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg dark:text-foreground">Contact d'Urgence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName" className="dark:text-foreground">Nom</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
                      placeholder="Marie Dupont"
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone" className="dark:text-foreground">Téléphone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleFieldChange('emergencyContactPhone', e.target.value)}
                      placeholder="+243 XX XXX XXXX"
                      className="dark:bg-card/95 dark:border-border/60 dark:text-foreground dark:placeholder:text-foreground/50"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleFieldChange('acceptTerms', checked)}
                  className="mt-1"
                />
                <label htmlFor="acceptTerms" className="text-sm cursor-pointer dark:text-foreground">
                  J'accepte les <span className="text-primary underline">conditions générales</span> et la{' '}
                  <span className="text-primary underline">politique de confidentialité</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {step !== 'details' && (
              <Button
                onClick={handleNext}
                disabled={!formData.serviceType && step === 'service'}
                className="flex-1 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                size="lg"
              >
                Continuer
              </Button>
            )}
            
            {step === 'details' && (
              <Button
                onClick={handleSubmit}
                disabled={isRegistering}
                className="flex-1 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                size="lg"
              >
                {isRegistering ? 'Inscription en cours...' : 'Finaliser l\'Inscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
