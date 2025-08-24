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
  Check,
  Loader2
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

interface ModernDeliveryInterfaceProps {
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

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
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

  // Auto-détection de géolocalisation
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

  const getStepProgress = () => {
    switch (currentStep) {
      case 'locations': return 33;
      case 'service': return 66;
      case 'confirmation': return 100;
      default: return 0;
    }
  };

  const LocationStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Auto-location notification */}
      {autoLocationDetected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-primary">Position détectée automatiquement</p>
            <p className="text-sm text-muted-foreground">Votre adresse de départ a été définie</p>
          </div>
        </motion.div>
      )}

      {/* Pickup Location */}
      <Card className="p-6 glass-card">
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
      <Card className="p-6 glass-card">
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
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
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
              className={`p-6 cursor-pointer transition-all duration-300 glass-card ${
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
      <Card className="p-6 glass-card">
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
          <Textarea
            placeholder="Instructions spéciales (optionnel)"
            value={formData.pickup.instructions}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              pickup: { ...prev.pickup, instructions: e.target.value }
            }))}
            rows={3}
          />
        </div>
      </Card>

      {/* Price estimate */}
      {formData.estimatedPrice > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimation de prix</p>
              <p className="text-2xl font-bold text-primary">{Math.round(formData.estimatedPrice).toLocaleString()} CDF</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.distance.toFixed(1)} km • {Math.round(formData.duration)} min
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const ConfirmationStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Order summary */}
      <Card className="p-6 glass-card">
        <h3 className="font-semibold mb-4">Résumé de la commande</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">De</p>
              <p className="font-medium">{formData.pickup.location?.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-secondary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Vers</p>
              <p className="font-medium">{formData.destination.location?.address}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">{deliveryModes.find(m => m.id === formData.mode)?.name}</p>
              <p className="text-sm text-muted-foreground">{formData.packageType} • {formData.weight}kg</p>
            </div>
            <p className="text-xl font-bold text-primary">{Math.round(formData.estimatedPrice).toLocaleString()} CDF</p>
          </div>
        </div>
      </Card>

      {/* Driver search */}
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            assignedDriver ? 'bg-green-500' : isSearchingDriver ? 'bg-blue-500' : 'bg-gray-500'
          }`}>
            {assignedDriver ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : isSearchingDriver ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Clock className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              {assignedDriver ? 'Livreur assigné' : isSearchingDriver ? 'Recherche de livreur...' : 'En attente'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {assignedDriver 
                ? `${assignedDriver.driver_profile?.display_name || 'Livreur'} va prendre votre commande`
                : isSearchingDriver 
                ? 'Nous cherchons le meilleur livreur pour vous'
                : 'Recherche en cours'
              }
            </p>
          </div>
        </div>

        {/* Timer */}
        {validationTimer > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Validation du livreur</span>
              <span className="font-mono">{Math.floor(validationTimer / 60)}:{(validationTimer % 60).toString().padStart(2, '0')}</span>
            </div>
            <Progress value={(120 - validationTimer) / 120 * 100} className="h-2" />
          </div>
        )}

        {/* Driver info */}
        {assignedDriver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">{assignedDriver.driver_profile?.display_name || 'Livreur Kwenda'}</p>
                <p className="text-sm text-green-600">
                  ★ {assignedDriver.driver_profile?.rating_average || '4.5'} • {assignedDriver.estimated_arrival || '8'} min
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header avec glassmorphism */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-white/20">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onCancel}
                className="rounded-full hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">Nouvelle livraison</h1>
                <p className="text-sm text-muted-foreground">
                  {currentStep === 'locations' && 'Définir les adresses'}
                  {currentStep === 'service' && 'Choisir le service'}
                  {currentStep === 'confirmation' && 'Confirmer la commande'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress bar animée */}
          <div className="mt-4">
            <Progress value={getStepProgress()} className="h-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {currentStep === 'locations' && <LocationStep key="locations" />}
          {currentStep === 'service' && <ServiceStep key="service" />}
          {currentStep === 'confirmation' && <ConfirmationStep key="confirmation" />}
        </AnimatePresence>
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-lg bg-white/90 border-t border-white/20">
        <div className="flex gap-3">
          {currentStep !== 'locations' && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1 h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}
          
          {currentStep !== 'confirmation' ? (
            <Button
              onClick={handleNext}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirmOrder}
              disabled={!assignedDriver}
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmer la commande
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernDeliveryInterface;