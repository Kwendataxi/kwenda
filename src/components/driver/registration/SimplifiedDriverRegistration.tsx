import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Package, User, Phone, Mail, FileText, Shield, ArrowLeft } from 'lucide-react';
import { ServiceCategory } from './ServiceCategorySelector';
import { SpecificServiceSelector } from './SpecificServiceSelector';
import { DriverRegistrationData } from '@/hooks/useDriverRegistration';

interface SimplifiedDriverRegistrationProps {
  serviceCategory: ServiceCategory;
  onSubmit: (data: DriverRegistrationData) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

export const SimplifiedDriverRegistration: React.FC<SimplifiedDriverRegistrationProps> = ({
  serviceCategory,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DriverRegistrationData>>({
    serviceCategory,
    acceptsTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedService) {
      newErrors.serviceType = 'Veuillez sélectionner un service';
    }
    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Nom complet requis';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    if (!formData.password?.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Numéro de téléphone requis';
    }
    if (!formData.licenseNumber?.trim()) {
      newErrors.licenseNumber = 'Numéro de permis requis';
    }
    if (!formData.licenseExpiry) {
      newErrors.licenseExpiry = 'Date d\'expiration du permis requise';
    }
    // Validation des champs véhicule seulement si le chauffeur a son propre véhicule
    if (formData.hasOwnVehicle) {
      if (!formData.vehicleMake?.trim()) {
        newErrors.vehicleMake = 'Marque du véhicule requise';
      }
      if (!formData.vehicleModel?.trim()) {
        newErrors.vehicleModel = 'Modèle du véhicule requis';
      }
      if (!formData.vehicleYear || formData.vehicleYear < 2000) {
        newErrors.vehicleYear = 'Année du véhicule invalide';
      }
      if (!formData.vehiclePlate?.trim()) {
        newErrors.vehiclePlate = 'Plaque d\'immatriculation requise';
      }
      if (!formData.vehicleColor?.trim()) {
        newErrors.vehicleColor = 'Couleur du véhicule requise';
      }
      if (!formData.insuranceNumber?.trim()) {
        newErrors.insuranceNumber = 'Numéro d\'assurance requis';
      }
    }
    if (!formData.acceptsTerms) {
      newErrors.acceptsTerms = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && selectedService) {
      const completeData: DriverRegistrationData = {
        ...formData,
        serviceType: selectedService,
        vehicleType: selectedService,
        hasOwnVehicle: false, // Par défaut dans cette interface simplifiée
      } as DriverRegistrationData;
      
      await onSubmit(completeData);
    }
  };

  const updateField = (field: keyof DriverRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {serviceCategory === 'taxi' ? (
          <Car className="h-8 w-8 text-primary" />
        ) : (
          <Package className="h-8 w-8 text-primary" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Inscription {serviceCategory === 'taxi' ? 'Chauffeur Taxi' : 'Livreur'}
          </h1>
          <p className="text-muted-foreground">
            Rejoignez notre plateforme en 2 étapes simples
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Étape 1: Sélection du service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              Choisissez votre service spécifique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpecificServiceSelector
              serviceCategory={serviceCategory}
              selectedService={selectedService}
              onServiceSelect={setSelectedService}
              disabled={isLoading}
            />
            {errors.serviceType && (
              <Alert className="mt-4">
                <AlertDescription className="text-destructive">
                  {errors.serviceType}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Étape 2: Informations personnelles et véhicule */}
        {selectedService && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                Vos informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Informations personnelles</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Nom complet *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName || ''}
                      onChange={(e) => updateField('displayName', e.target.value)}
                      placeholder="Votre nom complet"
                      className={errors.displayName ? 'border-destructive' : ''}
                    />
                    {errors.displayName && (
                      <p className="text-sm text-destructive mt-1">{errors.displayName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber">Téléphone *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={(e) => updateField('phoneNumber', e.target.value)}
                      placeholder="+243 xxx xxx xxx"
                      className={errors.phoneNumber ? 'border-destructive' : ''}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="votre@email.com"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">{errors.password}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations du permis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Permis de conduire</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">Numéro de permis *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber || ''}
                      onChange={(e) => updateField('licenseNumber', e.target.value)}
                      placeholder="Numéro de permis"
                      className={errors.licenseNumber ? 'border-destructive' : ''}
                    />
                    {errors.licenseNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.licenseNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="licenseExpiry">Date d'expiration *</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      value={formData.licenseExpiry || ''}
                      onChange={(e) => updateField('licenseExpiry', e.target.value)}
                      className={errors.licenseExpiry ? 'border-destructive' : ''}
                    />
                    {errors.licenseExpiry && (
                      <p className="text-sm text-destructive mt-1">{errors.licenseExpiry}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations du véhicule */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Informations du véhicule</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="vehicleMake">Marque *</Label>
                    <Input
                      id="vehicleMake"
                      value={formData.vehicleMake || ''}
                      onChange={(e) => updateField('vehicleMake', e.target.value)}
                      placeholder="Toyota, Honda..."
                      className={errors.vehicleMake ? 'border-destructive' : ''}
                    />
                    {errors.vehicleMake && (
                      <p className="text-sm text-destructive mt-1">{errors.vehicleMake}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleModel">Modèle *</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel || ''}
                      onChange={(e) => updateField('vehicleModel', e.target.value)}
                      placeholder="Corolla, Civic..."
                      className={errors.vehicleModel ? 'border-destructive' : ''}
                    />
                    {errors.vehicleModel && (
                      <p className="text-sm text-destructive mt-1">{errors.vehicleModel}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleYear">Année *</Label>
                    <Input
                      id="vehicleYear"
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={formData.vehicleYear || ''}
                      onChange={(e) => updateField('vehicleYear', parseInt(e.target.value))}
                      placeholder="2020"
                      className={errors.vehicleYear ? 'border-destructive' : ''}
                    />
                    {errors.vehicleYear && (
                      <p className="text-sm text-destructive mt-1">{errors.vehicleYear}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehiclePlate">Plaque d'immatriculation *</Label>
                    <Input
                      id="vehiclePlate"
                      value={formData.vehiclePlate || ''}
                      onChange={(e) => updateField('vehiclePlate', e.target.value)}
                      placeholder="ABC-123"
                      className={errors.vehiclePlate ? 'border-destructive' : ''}
                    />
                    {errors.vehiclePlate && (
                      <p className="text-sm text-destructive mt-1">{errors.vehiclePlate}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleColor">Couleur *</Label>
                    <Input
                      id="vehicleColor"
                      value={formData.vehicleColor || ''}
                      onChange={(e) => updateField('vehicleColor', e.target.value)}
                      placeholder="Blanc, Noir..."
                      className={errors.vehicleColor ? 'border-destructive' : ''}
                    />
                    {errors.vehicleColor && (
                      <p className="text-sm text-destructive mt-1">{errors.vehicleColor}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assurance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Assurance véhicule</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insuranceNumber">Numéro d'assurance *</Label>
                    <Input
                      id="insuranceNumber"
                      value={formData.insuranceNumber || ''}
                      onChange={(e) => updateField('insuranceNumber', e.target.value)}
                      placeholder="Numéro de police"
                      className={errors.insuranceNumber ? 'border-destructive' : ''}
                    />
                    {errors.insuranceNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.insuranceNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="insuranceExpiry">Date d'expiration</Label>
                    <Input
                      id="insuranceExpiry"
                      type="date"
                      value={formData.insuranceExpiry || ''}
                      onChange={(e) => updateField('insuranceExpiry', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptsTerms"
                    checked={formData.acceptsTerms || false}
                    onCheckedChange={(checked) => updateField('acceptsTerms', checked)}
                  />
                  <Label htmlFor="acceptsTerms" className="text-sm">
                    J'accepte les <a href="#" className="text-primary hover:underline">conditions d'utilisation</a> et la <a href="#" className="text-primary hover:underline">politique de confidentialité</a> *
                  </Label>
                </div>
                {errors.acceptsTerms && (
                  <p className="text-sm text-destructive">{errors.acceptsTerms}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? 'Inscription...' : 'Créer mon compte'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};