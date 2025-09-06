import React, { useState } from 'react';
import { ServiceCategorySelector, ServiceCategory } from './ServiceCategorySelector';
import { SpecificServiceSelector } from './SpecificServiceSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';

interface DifferentiatedDriverRegistrationProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const DifferentiatedDriverRegistration: React.FC<DifferentiatedDriverRegistrationProps> = ({
  onSuccess,
  onBack,
}) => {
  const [step, setStep] = useState<'category' | 'service' | 'form'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const { registerDriver, isRegistering } = useDriverRegistration();

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setSelectedService(null);
    setStep('service');
  };

  const handleServiceSelect = (serviceType: string) => {
    setSelectedService(serviceType);
    setStep('form');
  };

  const handleRegistrationSubmit = async (formData: any) => {
    if (!selectedCategory || !selectedService) return;

    try {
      await registerDriver({
        ...formData,
        serviceCategory: selectedCategory,
        serviceType: selectedService,
      });
      onSuccess();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'service':
        setStep('category');
        setSelectedCategory(null);
        break;
      case 'form':
        setStep('service');
        setSelectedService(null);
        break;
      default:
        onBack();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'category':
        return selectedCategory !== null;
      case 'service':
        return selectedService !== null;
      case 'form':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-2">
        <div className={`h-2 w-8 rounded-full ${step === 'category' ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-2 w-8 rounded-full ${step === 'service' ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-2 w-8 rounded-full ${step === 'form' ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 'category' && (
          <ServiceCategorySelector
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            disabled={isRegistering}
          />
        )}

        {step === 'service' && selectedCategory && (
          <SpecificServiceSelector
            serviceCategory={selectedCategory}
            selectedService={selectedService}
            onServiceSelect={handleServiceSelect}
            disabled={isRegistering}
          />
        )}

        {step === 'form' && selectedCategory && selectedService && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Finaliser votre inscription
              </h2>
              <p className="text-muted-foreground">
                Service sélectionné: <span className="font-medium">{selectedService}</span> 
                {' '}({selectedCategory})
              </p>
            </div>

            {/* Formulaire simplifié pour cette démo */}
            <div className="bg-muted/30 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Formulaire détaillé à implémenter selon le service choisi...
              </p>
              
              <div className="space-y-4">
                <div className="text-sm">
                  <strong>Type de service:</strong> {selectedCategory === 'taxi' ? 'Chauffeur Taxi' : 'Livreur'}
                </div>
                <div className="text-sm">
                  <strong>Service spécifique:</strong> {selectedService}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isRegistering}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {step !== 'form' && (
          <Button
            onClick={() => {
              if (step === 'category' && selectedCategory) {
                setStep('service');
              } else if (step === 'service' && selectedService) {
                setStep('form');
              }
            }}
            disabled={!canProceed() || isRegistering}
            className="flex items-center gap-2"
          >
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {step === 'form' && (
          <Button
            onClick={() => handleRegistrationSubmit({})}
            disabled={isRegistering}
            className="flex items-center gap-2"
          >
            {isRegistering ? 'Inscription en cours...' : 'Finaliser l\'inscription'}
          </Button>
        )}
      </div>
    </div>
  );
};