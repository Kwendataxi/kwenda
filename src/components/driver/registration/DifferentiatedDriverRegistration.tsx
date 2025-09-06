import React, { useState } from 'react';
import { ServiceCategorySelector, ServiceCategory } from './ServiceCategorySelector';
import { SpecificServiceSelector } from './SpecificServiceSelector';
import { DriverPersonalDataForm } from './DriverPersonalDataForm';
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
          <DriverPersonalDataForm
            serviceCategory={selectedCategory}
            serviceType={selectedService}
            onSubmit={handleRegistrationSubmit}
            onBack={handleBack}
            isLoading={isRegistering}
          />
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

{/* Form handles its own submit button */}
      </div>
    </div>
  );
};