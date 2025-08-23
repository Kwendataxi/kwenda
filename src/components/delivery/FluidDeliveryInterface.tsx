import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { useDriverAssignment } from '@/hooks/useDriverAssignment';
import SimpleLocationSearch from './SimpleLocationSearch';
import { 
  ArrowLeft,
  ArrowRight,
  MapPin, 
  Target,
  Bike,
  Car,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Zap,
  Timer,
  User,
  Phone,
  Navigation,
  Gauge,
  Shield,
  Search,
  X,
  Check
} from 'lucide-react';

interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface ContactInfo {
  name: string;
  phone: string;
}

interface DeliveryData {
  pickup: {
    location: DeliveryLocation | null;
    contact: ContactInfo;
    instructions: string;
  };
  destination: {
    location: DeliveryLocation | null;
    contact: ContactInfo;
    instructions: string;
  };
  mode: 'flash' | 'flex' | 'maxicharge';
  packageType: string;
  weight: number;
  estimatedPrice: number;
  distance: number;
  duration: number;
}

interface FluidDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const deliveryModes = [
  {
    id: 'flash',
    name: 'Flash',
    subtitle: 'Express 15-30min',
    icon: Bike,
    time: '15-30 min',
    description: 'Moto express documents et petits colis',
    features: ['Jusqu\'à 5kg', 'Étanche', 'GPS temps réel'],
    price: '+50%',
    color: 'from-orange-500 to-red-500',
    maxWeight: 5,
    vehicleType: 'moto',
    basePrice: 3000
  },
  {
    id: 'flex',
    name: 'Flex',
    subtitle: 'Standard 30-60min',
    icon: Car,
    time: '30-60 min',
    description: 'Camionnette pour tous vos besoins',
    features: ['Jusqu\'à 50kg', 'Protection optimale', 'Volume important'],
    price: 'Recommandé',
    color: 'from-blue-500 to-purple-500',
    maxWeight: 50,
    vehicleType: 'car',
    basePrice: 2500
  },
  {
    id: 'maxicharge',
    name: 'MaxiCharge',
    subtitle: 'Gros volume 1-2h',
    icon: Truck,
    time: '1-2h',
    description: 'Camion pour électroménager et meubles',
    features: ['Jusqu\'à 500kg', 'Assistant chargement', 'Équipement pro'],
    price: '+100%',
    color: 'from-green-500 to-teal-500',
    maxWeight: 500,
    vehicleType: 'truck',
    basePrice: 5000
  }
];

const FluidDeliveryInterface = ({ onSubmit, onCancel }: FluidDeliveryInterfaceProps) => {
  const [currentStep, setCurrentStep] = useState<'locations' | 'service' | 'confirmation'>('locations');
  const [formData, setFormData] = useState<DeliveryData>({
    pickup: {
      location: null,
      contact: { name: '', phone: '' },
      instructions: ''
    },
    destination: {
      location: null,
      contact: { name: '', phone: '' },
      instructions: ''
    },
    mode: 'flex',
    packageType: '',
    weight: 0,
    estimatedPrice: 0,
    distance: 0,
    duration: 0
  });

  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [validationTimer, setValidationTimer] = useState(0);
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [autoLocationDetected, setAutoLocationDetected] = useState(false);

  const { toast } = useToast();
  const { location, getCurrentPosition, searchLocation, loading: locationLoading } = useMasterLocation({ autoDetectLocation: true });
  const { findAvailableDrivers, assignDriverToDelivery } = useDriverAssignment();

  // Auto-détection de géolocalisation avec notification élégante
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const position = await getCurrentPosition({ enableHighAccuracy: true });
        if (position) {
          setFormData(prev => ({
            ...prev,
            pickup: {
              ...prev.pickup,
              location: {
                address: position.address,
                coordinates: { lat: position.lat, lng: position.lng }
              }
            }
          }));
          setAutoLocationDetected(true);
          
          // Notification moderne comme dans l'image
          toast({
            title: "📍 Position détectée",
            description: "Votre adresse de départ a été automatiquement définie",
            duration: 3000,
          });
        }
      } catch (error) {
        console.log('Géolocalisation non disponible');
      }
    };

    detectUserLocation();
  }, [getCurrentPosition, toast]);

  // Calcul automatique du prix
  const calculatePrice = useCallback(() => {
    if (formData.pickup.location && formData.destination.location) {
      const selectedMode = deliveryModes.find(m => m.id === formData.mode);
      if (selectedMode) {
        // Simulation calcul distance (en km)
        const distance = Math.random() * 10 + 2; // 2-12 km
        const basePrice = selectedMode.basePrice;
        const pricePerKm = 300;
        const totalPrice = basePrice + (distance * pricePerKm);
        
        setFormData(prev => ({
          ...prev,
          estimatedPrice: totalPrice,
          distance: distance,
          duration: distance * 3 // 3 min par km approximatif
        }));
      }
    }
  }, [formData.pickup.location, formData.destination.location, formData.mode]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  // Timer de validation 2 minutes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (validationTimer > 0) {
      interval = setInterval(() => {
        setValidationTimer(prev => {
          if (prev <= 1) {
            searchNewDriver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [validationTimer]);

  const searchNewDriver = async () => {
    if (!formData.pickup.location || !formData.destination.location) return;
    
    setIsSearchingDriver(true);
    try {
      const drivers = await findAvailableDrivers({
        pickup_location: formData.pickup.location.address,
        pickup_coordinates: formData.pickup.location.coordinates,
        destination: formData.destination.location.address,
        destination_coordinates: formData.destination.location.coordinates,
        service_type: formData.mode,
        vehicle_class: deliveryModes.find(m => m.id === formData.mode)?.vehicleType || 'car'
      });

      if (drivers.length > 0) {
        setAssignedDriver(drivers[0]);
        setValidationTimer(120); // 2 minutes
        toast({
          title: "✅ Livreur trouvé !",
          description: `${drivers[0].driver_profile?.display_name || 'Livreur'} peut vous livrer`,
        });
      } else {
        toast({
          title: "🔍 Recherche en cours...",
          description: "Nous continuons à chercher un livreur disponible",
        });
        setTimeout(searchNewDriver, 30000); // Retry in 30s
      }
    } catch (error) {
      console.error('Erreur recherche livreur:', error);
      toast({
        title: "❌ Erreur",
        description: "Problème lors de la recherche de livreur",
        variant: "destructive"
      });
    } finally {
      setIsSearchingDriver(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'locations') {
      if (formData.pickup.location && formData.destination.location) {
        setCurrentStep('service');
      } else {
        toast({
          title: "Adresses requises",
          description: "Veuillez définir le départ et la destination",
          variant: "destructive"
        });
      }
    } else if (currentStep === 'service') {
      if (formData.packageType && formData.weight > 0) {
        setCurrentStep('confirmation');
        searchNewDriver(); // Commencer la recherche de livreur
      } else {
        toast({
          title: "Informations requises",
          description: "Veuillez remplir les détails du colis",
          variant: "destructive"
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'service') {
      setCurrentStep('locations');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('service');
      setIsSearchingDriver(false);
      setAssignedDriver(null);
      setValidationTimer(0);
    }
  };

  const handleConfirmOrder = async () => {
    if (!assignedDriver) {
      toast({
        title: "Aucun livreur assigné",
        description: "Veuillez attendre l'assignation d'un livreur",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        ...formData,
        driverId: assignedDriver.driver_id,
        status: 'confirmed'
      };
      
      onSubmit(orderData);
      
      toast({
        title: "🎉 Commande confirmée !",
        description: "Votre livraison a été créée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la commande",
        variant: "destructive"
      });
    }
  };

  const LocationStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Auto-location notification */}
      {autoLocationDetected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-800">Position détectée automatiquement</p>
            <p className="text-sm text-green-600">Votre adresse de départ a été définie</p>
          </div>
        </motion.div>
      )}

      {/* Pickup Location */}
      <Card className="p-6 card-floating">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Adresse de départ</h3>
            <p className="text-sm text-muted-foreground">Où récupérer le colis ?</p>
          </div>
        </div>
        
        <SimpleLocationSearch
          onLocationSelect={(location) => 
            setFormData(prev => ({
              ...prev,
              pickup: { ...prev.pickup, location }
            }))
          }
          placeholder="Rechercher l'adresse de départ..."
          currentLocation={formData.pickup.location}
        />
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Input
            placeholder="Nom contact"
            value={formData.pickup.contact.name}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, name: e.target.value }}
            }))}
          />
          <Input
            placeholder="Téléphone"
            value={formData.pickup.contact.phone}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, phone: e.target.value }}
            }))}
          />
        </div>
      </Card>

      {/* Destination Location */}
      <Card className="p-6 card-floating">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Adresse de destination</h3>
            <p className="text-sm text-muted-foreground">Où livrer le colis ?</p>
          </div>
        </div>
        
        <SimpleLocationSearch
          onLocationSelect={(location) => 
            setFormData(prev => ({
              ...prev,
              destination: { ...prev.destination, location }
            }))
          }
          placeholder="Rechercher l'adresse de destination..."
          currentLocation={formData.destination.location}
        />
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Input
            placeholder="Nom contact"
            value={formData.destination.contact.name}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              destination: { ...prev.destination, contact: { ...prev.destination.contact, name: e.target.value }}
            }))}
          />
          <Input
            placeholder="Téléphone"
            value={formData.destination.contact.phone}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              destination: { ...prev.destination, contact: { ...prev.destination.contact, phone: e.target.value }}
            }))}
          />
        </div>
      </Card>
    </motion.div>
  );

  const ServiceStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Delivery modes */}
      <div className="space-y-4">
        {deliveryModes.map((mode) => (
          <motion.div
            key={mode.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`p-6 cursor-pointer transition-all duration-200 ${
                formData.mode === mode.id 
                  ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                  : 'hover:shadow-md hover:border-primary/30'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, mode: mode.id as any }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${mode.color} flex items-center justify-center`}>
                    <mode.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{mode.name}</h3>
                      {mode.id === 'flex' && <Badge variant="secondary">Recommandé</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{mode.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{mode.price}</p>
                  <p className="text-sm text-muted-foreground">{mode.time}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Package details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Détails du colis</h3>
        <div className="space-y-4">
          <Input
            placeholder="Type de colis (ex: Documents, Vêtements, Nourriture...)"
            value={formData.packageType}
            onChange={(e) => setFormData(prev => ({ ...prev, packageType: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Poids approximatif (kg)"
            value={formData.weight || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </Card>
    </motion.div>
  );

  const ConfirmationStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Order summary */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Récapitulatif de votre livraison</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Service:</span>
            <span className="font-medium">{deliveryModes.find(m => m.id === formData.mode)?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Distance:</span>
            <span>{formData.distance.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between">
            <span>Temps estimé:</span>
            <span>{Math.round(formData.duration)} min</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>Prix total:</span>
              <span className="text-primary">{formData.estimatedPrice.toLocaleString()} CDF</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Driver search status */}
      {isSearchingDriver && !assignedDriver && (
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium">Recherche de livreur en cours...</h4>
              <p className="text-sm text-muted-foreground">Nous cherchons le meilleur livreur disponible</p>
            </div>
          </div>
        </Card>
      )}

      {/* Assigned driver with timer */}
      {assignedDriver && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">
                  {assignedDriver.driver_profile?.display_name || 'Livreur assigné'}
                </h4>
                <p className="text-sm text-green-600">
                  Arrivée estimée: {assignedDriver.estimated_arrival || '5-10 min'}
                </p>
              </div>
            </div>
            
            {validationTimer > 0 && (
              <div className="text-center">
                <div className="w-16 h-16 relative">
                  <Progress 
                    value={(validationTimer / 120) * 100} 
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono">
                      {Math.floor(validationTimer / 60)}:{String(validationTimer % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Validation</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );

  const getStepProgress = () => {
    switch (currentStep) {
      case 'locations': return 33;
      case 'service': return 66;
      case 'confirmation': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header moderne avec verre morphisme */}
      <motion.div 
        className="glass sticky top-0 z-50 border-b"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={currentStep === 'locations' ? onCancel : handlePrevious}
              className="hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <h1 className="font-bold text-lg">🚚 Livraison Express</h1>
              <p className="text-xs text-muted-foreground">Kwenda Delivery</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="max-w-md mx-auto p-4">
        <AnimatePresence mode="wait">
          {currentStep === 'locations' && <LocationStep key="locations" />}
          {currentStep === 'service' && <ServiceStep key="service" />}
          {currentStep === 'confirmation' && <ConfirmationStep key="confirmation" />}
        </AnimatePresence>

        {/* Navigation buttons */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t p-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <div className="max-w-md mx-auto">
            {currentStep !== 'confirmation' ? (
              <Button 
                onClick={handleNext}
                className="w-full h-12 btn-modern bg-gradient-primary text-white font-medium"
                disabled={
                  (currentStep === 'locations' && (!formData.pickup.location || !formData.destination.location)) ||
                  (currentStep === 'service' && (!formData.packageType || formData.weight <= 0))
                }
              >
                Continuer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirmOrder}
                className="w-full h-12 btn-modern bg-gradient-primary text-white font-medium"
                disabled={!assignedDriver || isSearchingDriver}
              >
                {isSearchingDriver ? (
                  <>
                    <Search className="w-4 h-4 mr-2 animate-spin" />
                    Recherche en cours...
                  </>
                ) : assignedDriver ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmer la livraison
                  </>
                ) : (
                  'En attente de livreur...'
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FluidDeliveryInterface;