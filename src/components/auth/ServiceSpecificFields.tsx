import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Truck } from 'lucide-react';

interface ServiceSpecificFieldsProps {
  serviceCategory: 'taxi' | 'delivery';
  hasOwnVehicle: boolean;
  formData: any;
  onFieldChange: (field: string, value: any) => void;
}

export const ServiceSpecificFields: React.FC<ServiceSpecificFieldsProps> = ({
  serviceCategory,
  hasOwnVehicle,
  formData,
  onFieldChange
}) => {
  const getServiceTypeOptions = () => {
    if (serviceCategory === 'taxi') {
      return [
        { value: 'taxi-standard', label: 'Taxi Standard' },
        { value: 'taxi-premium', label: 'Taxi Premium' },
        { value: 'taxi-bus', label: 'Taxi Bus' },
        { value: 'vtc', label: 'VTC' }
      ];
    } else {
      return [
        { value: 'moto-flash', label: 'Moto Flash (Express)' },
        { value: 'vehicule-flex', label: 'Véhicule Flex (Standard)' },
        { value: 'maxicharge', label: 'Maxicharge (Gros volumes)' }
      ];
    }
  };

  const getVehicleTypeOptions = () => {
    if (serviceCategory === 'taxi') {
      return [
        { value: 'berline', label: 'Berline' },
        { value: 'suv', label: 'SUV' },
        { value: 'minibus', label: 'Minibus' },
        { value: 'break', label: 'Break' }
      ];
    } else {
      return [
        { value: 'moto', label: 'Moto' },
        { value: 'scooter', label: 'Scooter' },
        { value: 'camionnette', label: 'Camionnette' },
        { value: 'camion', label: 'Camion' }
      ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Type de service */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {serviceCategory === 'taxi' ? (
              <Car className="h-5 w-5" />
            ) : (
              <Truck className="h-5 w-5" />
            )}
            {serviceCategory === 'taxi' ? 'Service de transport' : 'Service de livraison'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <div className="space-y-4">
            <div className="relative z-50 overflow-visible">
              <Label htmlFor="serviceType" className="flex items-center gap-1">
                Type de service <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.serviceType} 
                onValueChange={(value) => {
                  console.log('🔍 Service sélectionné:', value);
                  onFieldChange('serviceType', value);
                }}
              >
                <SelectTrigger className="relative z-50 bg-background">
                  <SelectValue placeholder={`Sélectionnez le type de ${serviceCategory === 'taxi' ? 'transport' : 'livraison'}`} />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  {getServiceTypeOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.serviceType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ce champ est obligatoire
                </p>
              )}
            </div>

            {serviceCategory === 'delivery' && (
              <div className="relative z-50 overflow-visible">
                <Label htmlFor="deliveryCapacity" className="flex items-center gap-1">
                  Capacité de chargement <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.deliveryCapacity} 
                  onValueChange={(value) => {
                    console.log('🔍 Capacité sélectionnée:', value);
                    onFieldChange('deliveryCapacity', value);
                  }}
                >
                  <SelectTrigger className="relative z-50 bg-background">
                    <SelectValue placeholder="Sélectionnez la capacité" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="small">Petits colis (jusqu'à 10kg)</SelectItem>
                    <SelectItem value="medium">Colis moyens (jusqu'à 50kg)</SelectItem>
                    <SelectItem value="large">Gros colis (jusqu'à 200kg)</SelectItem>
                    <SelectItem value="extra-large">Très gros colis (plus de 200kg)</SelectItem>
                  </SelectContent>
                </Select>
                {!formData.deliveryCapacity && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce champ est obligatoire
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations véhicule si propriétaire */}
      {hasOwnVehicle && (
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Informations du véhicule</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative z-50 overflow-visible">
                <Label htmlFor="vehicleType" className="flex items-center gap-1">
                  Type de véhicule <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.vehicleType} 
                  onValueChange={(value) => {
                    console.log('🔍 Type de véhicule sélectionné:', value);
                    onFieldChange('vehicleType', value);
                  }}
                >
                  <SelectTrigger className="relative z-50 bg-background">
                    <SelectValue placeholder="Type de véhicule" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    {getVehicleTypeOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.vehicleType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce champ est obligatoire
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="vehicleMake">Marque *</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={(e) => onFieldChange('vehicleMake', e.target.value)}
                  placeholder="Ex: Toyota, Honda"
                  required={hasOwnVehicle}
                />
              </div>

              <div>
                <Label htmlFor="vehicleModel">Modèle *</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => onFieldChange('vehicleModel', e.target.value)}
                  placeholder="Ex: Corolla, Civic"
                  required={hasOwnVehicle}
                />
              </div>

              <div>
                <Label htmlFor="vehicleYear">Année *</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  value={formData.vehicleYear}
                  onChange={(e) => onFieldChange('vehicleYear', parseInt(e.target.value))}
                  placeholder="Ex: 2020"
                  min="1990"
                  max={new Date().getFullYear()}
                  required={hasOwnVehicle}
                />
              </div>

              <div>
                <Label htmlFor="vehiclePlate">Plaque d'immatriculation *</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) => onFieldChange('vehiclePlate', e.target.value.toUpperCase())}
                  placeholder="Ex: CD-123-ABC"
                  required={hasOwnVehicle}
                />
              </div>

              <div>
                <Label htmlFor="vehicleColor">Couleur</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={(e) => onFieldChange('vehicleColor', e.target.value)}
                  placeholder="Ex: Rouge, Blanc"
                />
              </div>

              <div>
                <Label htmlFor="insuranceNumber">Numéro d'assurance *</Label>
                <Input
                  id="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={(e) => onFieldChange('insuranceNumber', e.target.value)}
                  placeholder="Numéro de police d'assurance"
                  required={hasOwnVehicle}
                />
              </div>

              <div>
                <Label htmlFor="insuranceExpiry">Expiration assurance</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => onFieldChange('insuranceExpiry', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};