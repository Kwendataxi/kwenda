import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, MapPin, Clock, Package, Truck, Car, Phone, User, Home } from 'lucide-react';

import { useDriverAssignment } from '@/hooks/useDriverAssignment';

interface MultiSlideDeliveryProps {
  onSubmit: (deliveryData: any) => void;
  onCancel: () => void;
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  contactName?: string;
  contactPhone?: string;
}

export const MultiSlideDeliveryInterface: React.FC<MultiSlideDeliveryProps> = ({
  onSubmit,
  onCancel
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [deliveryType, setDeliveryType] = useState<'flash' | 'flex' | 'maxicharge'>('flex');
  
  // État des données de livraison
  const [pickupLocation, setPickupLocation] = useState<LocationData>({
    address: '',
    lat: 0,
    lng: 0,
    contactName: '',
    contactPhone: ''
  });
  
  const [destinationLocation, setDestinationLocation] = useState<LocationData>({
    address: '',
    lat: 0,
    lng: 0,
    contactName: '',
    contactPhone: ''
  });
  
  const [packageDetails, setPackageDetails] = useState({
    description: '',
    weight: '',
    fragile: false,
    value: ''
  });

  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { assignDriver, assignedDriver, validationTimer, loading } = useDriverAssignment();
  const { toast } = useToast();

  const slides = [
    'service-type',    // Choix du service
    'pickup-details',  // Détails récupération + contact
    'destination-details', // Détails destination + contact
    'package-info',    // Informations colis
    'confirmation',    // Confirmation et estimation
    'driver-assignment' // Assignation livreur avec timer
  ];

  const progress = ((currentSlide + 1) / slides.length) * 100;

  // Calcul estimation prix
  useEffect(() => {
    if (pickupLocation.lat && destinationLocation.lat) {
      const distance = calculateDistance(
        pickupLocation.lat, pickupLocation.lng,
        destinationLocation.lat, destinationLocation.lng
      );
      
      const rates = {
        flash: { base: 2000, perKm: 300 },
        flex: { base: 3000, perKm: 400 },
        maxicharge: { base: 5000, perKm: 600 }
      };
      
      const rate = rates[deliveryType];
      const price = rate.base + (distance * rate.perKm);
      setEstimatedPrice(Math.round(price));
    }
  }, [pickupLocation, destinationLocation, deliveryType]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const canProceed = () => {
    switch (slides[currentSlide]) {
      case 'service-type':
        return deliveryType !== null;
      case 'pickup-details':
        return pickupLocation.address && pickupLocation.contactPhone;
      case 'destination-details':
        return destinationLocation.address && destinationLocation.contactPhone;
      case 'package-info':
        return packageDetails.description && packageDetails.weight;
      case 'confirmation':
        return estimatedPrice > 0;
      default:
        return true;
    }
  };

  const handleFinalSubmit = async () => {
    if (currentSlide === slides.length - 2) { // Slide confirmation
      setIsSubmitting(true);
      
      try {
        // Créer la commande
        const deliveryData = {
          delivery_type: deliveryType,
          pickup_location: pickupLocation.address,
          pickup_coordinates: { lat: pickupLocation.lat, lng: pickupLocation.lng },
          pickup_contact_name: pickupLocation.contactName,
          pickup_contact_phone: pickupLocation.contactPhone,
          delivery_location: destinationLocation.address,
          delivery_coordinates: { lat: destinationLocation.lat, lng: destinationLocation.lng },
          delivery_contact_name: destinationLocation.contactName,
          delivery_contact_phone: destinationLocation.contactPhone,
          package_description: packageDetails.description,
          package_weight: parseFloat(packageDetails.weight),
          package_fragile: packageDetails.fragile,
          package_value: parseFloat(packageDetails.value) || 0,
          estimated_price: estimatedPrice
        };

        await onSubmit(deliveryData);
        
        // Passer au slide d'assignation de livreur
        nextSlide();
        
        // Lancer l'assignation automatique
        const result = await assignDriver({
          orderId: 'temp-' + Date.now(), // Sera remplacé par l'ID réel
          pickupCoordinates: pickupLocation,
          deliveryCoordinates: destinationLocation,
          deliveryType: deliveryType,
          priority: 'normal'
        });

        if (!result.success) {
          toast({
            title: "Aucun livreur disponible",
            description: result.error,
            variant: "destructive"
          });
        }

      } catch (error: any) {
        console.error('Erreur création commande:', error);
        toast({
          title: "Erreur",
          description: "Impossible de créer la commande",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Calcul de distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const renderSlide = () => {
    switch (slides[currentSlide]) {
      case 'service-type':
        return <ServiceTypeSlide 
          selectedType={deliveryType} 
          onSelect={setDeliveryType} 
        />;
      
      case 'pickup-details':
        return <PickupDetailsSlide 
          location={pickupLocation}
          onChange={setPickupLocation}
        />;
      
      case 'destination-details':
        return <DestinationDetailsSlide 
          location={destinationLocation}
          onChange={setDestinationLocation}
        />;
      
      case 'package-info':
        return <PackageInfoSlide 
          details={packageDetails}
          onChange={setPackageDetails}
        />;
      
      case 'confirmation':
        return <ConfirmationSlide 
          pickupLocation={pickupLocation}
          destinationLocation={destinationLocation}
          packageDetails={packageDetails}
          deliveryType={deliveryType}
          estimatedPrice={estimatedPrice}
        />;
      
      case 'driver-assignment':
        return <DriverAssignmentSlide 
          assignedDriver={assignedDriver}
          validationTimer={validationTimer}
          loading={loading}
        />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* En-tête avec progression */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Button>
          <Badge variant="secondary">
            {currentSlide + 1}/{slides.length}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progression</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Contenu du slide */}
        <Card className="min-h-[500px]">
          {renderSlide()}
        </Card>

        {/* Navigation */}
        {currentSlide < slides.length - 1 && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            
            {currentSlide === slides.length - 2 ? (
              <Button
                onClick={handleFinalSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Création...' : 'Confirmer commande'}
              </Button>
            ) : (
              <Button
                onClick={nextSlide}
                disabled={!canProceed()}
                className="flex-1"
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Composants des slides individuels
const ServiceTypeSlide: React.FC<{
  selectedType: string;
  onSelect: (type: 'flash' | 'flex' | 'maxicharge') => void;
}> = ({ selectedType, onSelect }) => (
  <CardContent className="p-6 space-y-6">
    <CardHeader className="px-0 pt-0">
      <CardTitle className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        Choisir le service de livraison
      </CardTitle>
    </CardHeader>

    <div className="space-y-4">
      {[
        {
          id: 'flash',
          name: 'Livraison Flash',
          icon: <Package className="h-6 w-6" />,
          description: 'Livraison rapide moto/scooter',
          time: '30-60 min',
          price: 'À partir de 2000 CDF',
          vehicles: ['Moto', 'Scooter']
        },
        {
          id: 'flex',
          name: 'Livraison Flex',
          icon: <Car className="h-6 w-6" />,
          description: 'Livraison standard camionnette',
          time: '1-2 heures',
          price: 'À partir de 3000 CDF',
          vehicles: ['Camionnette', 'Voiture']
        },
        {
          id: 'maxicharge',
          name: 'Maxi Charge',
          icon: <Truck className="h-6 w-6" />,
          description: 'Gros colis, camion',
          time: '2-4 heures',
          price: 'À partir de 5000 CDF',
          vehicles: ['Camion', 'Gros véhicule']
        }
      ].map((service) => (
        <Card
          key={service.id}
          className={`cursor-pointer transition-all ${
            selectedType === service.id 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'hover:border-primary/50'
          }`}
          onClick={() => onSelect(service.id as any)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedType === service.id ? 'bg-primary text-white' : 'bg-muted'
              }`}>
                {service.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{service.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.time}
                  </span>
                  <span className="font-medium text-primary">{service.price}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {service.vehicles.map(vehicle => (
                    <Badge key={vehicle} variant="secondary" className="text-xs">
                      {vehicle}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </CardContent>
);

const PickupDetailsSlide: React.FC<{
  location: LocationData;
  onChange: (data: LocationData) => void;
}> = ({ location, onChange }) => (
  <CardContent className="p-6 space-y-6">
    <CardHeader className="px-0 pt-0">
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Adresse de récupération
      </CardTitle>
    </CardHeader>

    <div className="space-y-4">
      <div>
        <Label htmlFor="pickup-address">Adresse de récupération *</Label>
        <Input
          id="pickup-address"
          value={location.address}
          onChange={(e) => onChange({
            ...location,
            address: e.target.value
          })}
          placeholder="Saisir l'adresse de récupération"
          required
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Contact récupération
        </h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="pickup-name">Nom du contact</Label>
            <Input
              id="pickup-name"
              value={location.contactName || ''}
              onChange={(e) => onChange({
                ...location,
                contactName: e.target.value
              })}
              placeholder="Nom de la personne"
            />
          </div>
          
          <div>
            <Label htmlFor="pickup-phone">Téléphone *</Label>
            <Input
              id="pickup-phone"
              type="tel"
              value={location.contactPhone || ''}
              onChange={(e) => onChange({
                ...location,
                contactPhone: e.target.value
              })}
              placeholder="+243 XX XXX XXXX"
              required
            />
          </div>
        </div>
      </div>
    </div>
  </CardContent>
);

const DestinationDetailsSlide: React.FC<{
  location: LocationData;
  onChange: (data: LocationData) => void;
}> = ({ location, onChange }) => (
  <CardContent className="p-6 space-y-6">
    <CardHeader className="px-0 pt-0">
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Adresse de livraison
      </CardTitle>
    </CardHeader>

    <div className="space-y-4">
      <div>
        <Label htmlFor="dest-address">Adresse de livraison *</Label>
        <Input
          id="dest-address"
          value={location.address}
          onChange={(e) => onChange({
            ...location,
            address: e.target.value
          })}
          placeholder="Saisir l'adresse de livraison"
          required
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Contact destinataire
        </h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="dest-name">Nom du destinataire</Label>
            <Input
              id="dest-name"
              value={location.contactName || ''}
              onChange={(e) => onChange({
                ...location,
                contactName: e.target.value
              })}
              placeholder="Nom de la personne"
            />
          </div>
          
          <div>
            <Label htmlFor="dest-phone">Téléphone *</Label>
            <Input
              id="dest-phone"
              type="tel"
              value={location.contactPhone || ''}
              onChange={(e) => onChange({
                ...location,
                contactPhone: e.target.value
              })}
              placeholder="+243 XX XXX XXXX"
              required
            />
          </div>
        </div>
      </div>
    </div>
  </CardContent>
);

const PackageInfoSlide: React.FC<{
  details: any;
  onChange: (details: any) => void;
}> = ({ details, onChange }) => (
  <CardContent className="p-6 space-y-6">
    <CardHeader className="px-0 pt-0">
      <CardTitle className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        Informations du colis
      </CardTitle>
    </CardHeader>

    <div className="space-y-4">
      <div>
        <Label htmlFor="description">Description du colis *</Label>
        <Input
          id="description"
          value={details.description}
          onChange={(e) => onChange({
            ...details,
            description: e.target.value
          })}
          placeholder="Ex: Documents, vêtements, électronique..."
          required
        />
      </div>

      <div>
        <Label htmlFor="weight">Poids approximatif (kg) *</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          value={details.weight}
          onChange={(e) => onChange({
            ...details,
            weight: e.target.value
          })}
          placeholder="1.5"
          required
        />
      </div>

      <div>
        <Label htmlFor="value">Valeur déclarée (CDF)</Label>
        <Input
          id="value"
          type="number"
          value={details.value}
          onChange={(e) => onChange({
            ...details,
            value: e.target.value
          })}
          placeholder="Optionnel"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="fragile"
          checked={details.fragile}
          onChange={(e) => onChange({
            ...details,
            fragile: e.target.checked
          })}
          className="rounded"
        />
        <Label htmlFor="fragile">Colis fragile</Label>
      </div>
    </div>
  </CardContent>
);

const ConfirmationSlide: React.FC<{
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  packageDetails: any;
  deliveryType: string;
  estimatedPrice: number;
}> = ({ pickupLocation, destinationLocation, packageDetails, deliveryType, estimatedPrice }) => (
  <CardContent className="p-6 space-y-6">
    <CardHeader className="px-0 pt-0">
      <CardTitle>Confirmation de commande</CardTitle>
    </CardHeader>

    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">Service sélectionné</h3>
        <Badge variant="secondary">{deliveryType.toUpperCase()}</Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 mt-1 text-green-600" />
          <div>
            <p className="font-medium">Récupération</p>
            <p className="text-sm text-muted-foreground">{pickupLocation.address}</p>
            <p className="text-xs">Contact: {pickupLocation.contactPhone}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 mt-1 text-red-600" />
          <div>
            <p className="font-medium">Livraison</p>
            <p className="text-sm text-muted-foreground">{destinationLocation.address}</p>
            <p className="text-xs">Contact: {destinationLocation.contactPhone}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-2">Colis</h3>
        <p className="text-sm">{packageDetails.description}</p>
        <p className="text-xs text-muted-foreground">
          Poids: {packageDetails.weight} kg
          {packageDetails.fragile && ' • Fragile'}
        </p>
      </div>

      <Separator />

      <div className="p-4 bg-primary/5 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium">Prix estimé</span>
          <span className="text-xl font-bold text-primary">
            {estimatedPrice.toLocaleString()} CDF
          </span>
        </div>
      </div>
    </div>
  </CardContent>
);

const DriverAssignmentSlide: React.FC<{
  assignedDriver: any;
  validationTimer: number | null;
  loading: boolean;
}> = ({ assignedDriver, validationTimer, loading }) => (
  <CardContent className="p-6 space-y-6">
    <CardHeader className="px-0 pt-0">
      <CardTitle>Recherche de livreur</CardTitle>
    </CardHeader>

    {loading && (
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p>Recherche du meilleur livreur...</p>
      </div>
    )}

    {assignedDriver && (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Livreur trouvé !</h3>
          <div className="space-y-2">
            <p className="font-medium">{assignedDriver.name}</p>
            <p className="text-sm text-muted-foreground">
              {assignedDriver.vehicle} • Note: ⭐ {assignedDriver.rating}/5
            </p>
            <p className="text-sm">
              Distance: {assignedDriver.distance.toFixed(1)} km
            </p>
            <p className="text-sm">
              Arrivée estimée: ~{assignedDriver.estimatedArrival} minutes
            </p>
          </div>
        </div>

        {validationTimer && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-amber-800">Confirmation en attente</span>
              <span className="text-lg font-bold text-amber-800">
                {Math.floor(validationTimer / 60)}:{(validationTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Progress value={(120 - validationTimer) / 120 * 100} className="h-2" />
            <p className="text-xs text-amber-700 mt-2">
              Le livreur dispose de 2 minutes pour accepter
            </p>
          </div>
        )}
      </div>
    )}
  </CardContent>
);

export default MultiSlideDeliveryInterface;