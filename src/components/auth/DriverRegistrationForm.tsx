import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { VehicleOwnershipSelector } from './VehicleOwnershipSelector';
import { ServiceSpecificFields } from './ServiceSpecificFields';
import { PartnerRequestForm } from './PartnerRequestForm';
import { toast } from 'sonner';

interface DriverRegistrationFormProps {
  serviceCategory: 'taxi' | 'delivery';
}

export const DriverRegistrationForm: React.FC<DriverRegistrationFormProps> = ({
  serviceCategory
}) => {
  const navigate = useNavigate();
  const { registerDriver, isRegistering } = useDriverRegistration();
  
  const [step, setStep] = useState(1);
  const [vehicleMode, setVehicleMode] = useState<'own' | 'partner' | null>(null);
  
  const [formData, setFormData] = useState({
    serviceCategory,
    serviceType: '',
    displayName: '',
    phoneNumber: '',
    email: '',
    password: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: 2020,
    vehiclePlate: '',
    vehicleColor: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    deliveryCapacity: '',
    bankAccountNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    acceptsTerms: false,
    hasOwnVehicle: false
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVehicleModeSelect = (mode: 'own' | 'partner') => {
    setVehicleMode(mode);
    setFormData(prev => ({
      ...prev,
      hasOwnVehicle: mode === 'own'
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return vehicleMode !== null;
      case 2:
        return !!(formData.displayName && formData.phoneNumber && formData.email && formData.password);
      case 3:
        return !!(formData.licenseNumber && formData.licenseExpiry && formData.serviceType);
      case 4:
        if (vehicleMode === 'own') {
          return !!(formData.vehicleType && formData.vehicleMake && formData.vehicleModel && 
                   formData.vehiclePlate && formData.insuranceNumber);
        }
        return true; // Pour mode partenaire, pas de validation véhicule
      case 5:
        return formData.acceptsTerms;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error('Veuillez accepter les conditions générales');
      return;
    }

    try {
      await registerDriver(formData);
      
      if (vehicleMode === 'partner') {
        toast.success('Inscription réussie ! Vous pouvez maintenant faire une demande à un partenaire.');
        // Rediriger vers la page de recherche de partenaires
        navigate('/driver/find-partner');
      } else {
        toast.success('Inscription réussie ! Votre compte sera activé après vérification.');
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <VehicleOwnershipSelector
            selectedMode={vehicleMode}
            onModeSelect={handleVehicleModeSelect}
            serviceCategory={serviceCategory}
          />
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Nom complet *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleFieldChange('displayName', e.target.value)}
                  placeholder="Prénom Nom"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Numéro de téléphone *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  placeholder="+243 900 000 000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  placeholder="Mot de passe sécurisé"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Permis de conduire</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">Numéro de permis *</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                  placeholder="Numéro de permis de conduire"
                  required
                />
              </div>
              <div>
                <Label htmlFor="licenseExpiry">Date d'expiration *</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleFieldChange('licenseExpiry', e.target.value)}
                  required
                />
              </div>
            </div>
            <ServiceSpecificFields
              serviceCategory={serviceCategory}
              hasOwnVehicle={false} // On affiche juste le type de service ici
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          </div>
        );

      case 4:
        if (vehicleMode === 'own') {
          return (
            <ServiceSpecificFields
              serviceCategory={serviceCategory}
              hasOwnVehicle={true}
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          );
        } else {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mode partenaire</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  Votre inscription sera complétée une fois qu'un partenaire acceptera votre demande.
                  Vous pourrez chercher des partenaires disponibles après cette étape.
                </p>
              </div>
            </div>
          );
        }

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations complémentaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">Contact d'urgence</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
                  placeholder="Nom du contact d'urgence"
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Téléphone d'urgence</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleFieldChange('emergencyContactPhone', e.target.value)}
                  placeholder="+243 900 000 000"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bankAccountNumber">Numéro de compte bancaire (optionnel)</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                  placeholder="Pour les paiements"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptsTerms"
                checked={formData.acceptsTerms}
                onCheckedChange={(checked) => handleFieldChange('acceptsTerms', checked)}
              />
              <Label htmlFor="acceptsTerms" className="text-sm">
                J'accepte les conditions générales d'utilisation et la politique de confidentialité
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">
              {serviceCategory === 'taxi' ? 'Devenir Chauffeur' : 'Devenir Livreur'}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                      step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200'
                    }`}>
                      {stepNumber}
                    </div>
                    {stepNumber < 5 && (
                      <div className={`w-8 h-1 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                Précédent
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!validateStep(step)}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!validateStep(5) || isRegistering}
                >
                  {isRegistering ? 'Inscription...' : 'Finaliser l\'inscription'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};