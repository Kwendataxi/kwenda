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
  Loader2,
  ChevronRight
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

interface UltraModernDeliveryInterfaceProps {
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
    color: 'from-orange-400 to-orange-600',
    gradient: 'bg-gradient-to-br from-orange-400/20 to-orange-600/20',
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
    color: 'from-primary to-primary-accent',
    gradient: 'bg-gradient-to-br from-primary/20 to-primary-accent/20',
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
    color: 'from-emerald-400 to-emerald-600',
    gradient: 'bg-gradient-to-br from-emerald-400/20 to-emerald-600/20',
    maxWeight: 500,
    vehicleType: 'truck',
    basePrice: 5000
  }
];

const UltraModernDeliveryInterface = ({ onSubmit, onCancel }: UltraModernDeliveryInterfaceProps) => {
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
  const { location, getCurrentPosition, searchLocation, loading: locationLoading } = useMasterLocation({ 
    autoDetectLocation: false // Désactiver l'auto-détection globale
  });
  const { findAvailableDrivers, assignDriverToDelivery } = useDriverAssignment();

  // Détection géolocalisation SÉCURISÉE et non-bloquante
  useEffect(() => {
    const detectLocationSafely = async () => {
      try {
        // Timeout très court pour éviter les blocages
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const position = await Promise.race([
          getCurrentPosition({ enableHighAccuracy: true, timeout: 3000 }),
          timeoutPromise
        ]);
        
        if (position && typeof position === 'object' && 'address' in position && 'lat' in position && 'lng' in position) {
          setFormData(prev => ({
            ...prev,
            pickup: {
              ...prev.pickup,
              location: {
                address: position.address as string,
                coordinates: { lat: position.lat as number, lng: position.lng as number }
              }
            }
          }));
          setAutoLocationDetected(true);
          
          toast({
            title: "📍 Position détectée",
            description: "Votre position de départ a été définie automatiquement",
            duration: 3000,
          });
        }
      } catch (error) {
        // Échec silencieux - interface reste utilisable
        console.log('Auto-detection échouée, continuez manuellement');
      }
    };

    // Délai de 1 seconde pour laisser l'interface se charger
    const timer = setTimeout(detectLocationSafely, 1000);
    return () => clearTimeout(timer);
  }, [getCurrentPosition, toast]);

  // Calcul automatique du prix avec animation
  const calculatePrice = useCallback(() => {
    if (formData.pickup.location && formData.destination.location) {
      const selectedMode = deliveryModes.find(m => m.id === formData.mode);
      if (selectedMode) {
        // Simulation calcul distance basé sur les coordonnées
        const lat1 = formData.pickup.location.coordinates.lat;
        const lng1 = formData.pickup.location.coordinates.lng;
        const lat2 = formData.destination.location.coordinates.lat;
        const lng2 = formData.destination.location.coordinates.lng;
        
        // Formule de Haversine simplifiée
        const distance = Math.sqrt(
          Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)
        ) * 111.32; // Approximation en km
        
        const realDistance = Math.max(distance, 1); // Minimum 1km
        const basePrice = selectedMode.basePrice;
        const pricePerKm = 400;
        const totalPrice = Math.round(basePrice + (realDistance * pricePerKm));
        
        setFormData(prev => ({
          ...prev,
          estimatedPrice: totalPrice,
          distance: realDistance,
          duration: Math.round(realDistance * 3.5) // 3.5 min par km
        }));
      }
    }
  }, [formData.pickup.location, formData.destination.location, formData.mode]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  // Timer de validation 2 minutes RÉEL
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (validationTimer > 0) {
      interval = setInterval(() => {
        setValidationTimer(prev => {
          if (prev <= 1) {
            // Auto-recherche d'un nouveau livreur
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
        const driver = drivers[0];
        setAssignedDriver(driver);
        setValidationTimer(120); // 2 minutes réelles
        
        toast({
          title: "✅ Livreur trouvé !",
          description: `${driver.driver_profile?.display_name || 'Livreur professionnel'} arrive dans ${driver.estimated_arrival || '5-10 min'}`,
        });
      } else {
        toast({
          title: "🔍 Recherche en cours...",
          description: "Nous continuons à chercher un livreur disponible",
        });
        // Retry automatique dans 30s
        setTimeout(searchNewDriver, 30000);
      }
    } catch (error) {
      console.error('Erreur recherche livreur:', error);
      toast({
        title: "❌ Erreur de recherche",
        description: "Problème temporaire, nous réessayons...",
        variant: "destructive"
      });
      // Retry dans 10s en cas d'erreur
      setTimeout(searchNewDriver, 10000);
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
          title: "🏠 Adresses requises",
          description: "Veuillez définir le départ et la destination",
          variant: "destructive"
        });
      }
    } else if (currentStep === 'service') {
      if (formData.packageType && formData.weight > 0) {
        setCurrentStep('confirmation');
        // Démarrage immédiat de la recherche de livreur
        searchNewDriver();
      } else {
        toast({
          title: "📦 Informations requises",
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
        title: "⏳ Livreur en attente",
        description: "Veuillez patienter pendant l'assignation d'un livreur",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        ...formData,
        driverId: assignedDriver.driver_id,
        status: 'confirmed',
        estimated_arrival: assignedDriver.estimated_arrival,
        driver_info: assignedDriver.driver_profile
      };
      
      await onSubmit(orderData);
      
      toast({
        title: "🎉 Commande confirmée !",
        description: "Votre livraison a été créée avec succès",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const LocationStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6"
    >
      {/* Auto-location elegant notification */}
      <AnimatePresence>
        {autoLocationDetected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            className="modern-glass-card bg-gradient-to-r from-primary/10 to-primary-accent/10 border border-primary/20 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 bg-gradient-to-r from-primary to-primary-accent rounded-full flex items-center justify-center"
              >
                <Navigation className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <p className="font-semibold text-primary">Position détectée automatiquement</p>
                <p className="text-sm text-muted-foreground">Votre adresse de départ a été définie avec précision</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pickup Location - Ultra-modern design */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="modern-glass-card p-6 border-0 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-accent rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Adresse de départ</h3>
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
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nom du contact</label>
              <Input
                placeholder="Ex: Jean Dupont"
                value={formData.pickup.contact.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, name: e.target.value }}
                }))}
                className="modern-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
              <Input
                placeholder="Ex: +243 XXX XXX XXX"
                value={formData.pickup.contact.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, phone: e.target.value }}
                }))}
                className="modern-input"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Arrow connector */}
      <div className="flex justify-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-8 h-8 bg-gradient-to-r from-secondary to-secondary-accent rounded-full flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4 text-white rotate-90" />
        </motion.div>
      </div>

      {/* Destination Location */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="modern-glass-card p-6 border-0 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-secondary to-secondary-accent rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Adresse de destination</h3>
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
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nom du contact</label>
              <Input
                placeholder="Ex: Marie Martin"
                value={formData.destination.contact.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  destination: { ...prev.destination, contact: { ...prev.destination.contact, name: e.target.value }}
                }))}
                className="modern-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
              <Input
                placeholder="Ex: +243 XXX XXX XXX"
                value={formData.destination.contact.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  destination: { ...prev.destination, contact: { ...prev.destination.contact, phone: e.target.value }}
                }))}
                className="modern-input"
              />
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );

  const ServiceStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6"
    >
      {/* Delivery modes - Ultra-modern cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Choisissez votre mode de livraison</h2>
        {deliveryModes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`p-6 cursor-pointer transition-all duration-300 modern-glass-card border-0 shadow-xl ${
                formData.mode === mode.id 
                  ? 'ring-2 ring-primary shadow-2xl bg-gradient-to-r from-primary/10 to-primary-accent/10' 
                  : 'hover:shadow-2xl hover:border-primary/20'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, mode: mode.id as any }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${mode.color} flex items-center justify-center shadow-lg`}
                    whileHover={{ rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <mode.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl">{mode.name}</h3>
                      {mode.id === 'flex' && (
                        <Badge className="bg-gradient-to-r from-primary to-primary-accent text-white">
                          Recommandé
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{mode.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                    <div className="flex gap-2 mt-2">
                      {mode.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formData.estimatedPrice > 0 ? `${formData.estimatedPrice.toLocaleString()} CDF` : mode.basePrice.toLocaleString() + ' CDF'}
                  </div>
                  <p className="text-sm text-muted-foreground">{mode.time}</p>
                  {formData.distance > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.distance.toFixed(1)}km • {formData.duration}min
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Package details - Modern form */}
      <Card className="modern-glass-card p-6 border-0 shadow-xl">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          Détails du colis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Type de colis</label>
            <Input
              placeholder="Ex: Documents, Électronique, Vêtements..."
              value={formData.packageType}
              onChange={(e) => setFormData(prev => ({ ...prev, packageType: e.target.value }))}
              className="modern-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Poids approximatif (kg)</label>
            <Input
              type="number"
              placeholder="Ex: 2.5"
              value={formData.weight || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              className="modern-input"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const ConfirmationStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold mb-6">Confirmation de commande</h2>

      {/* Driver search status */}
      <Card className="modern-glass-card p-6 border-0 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            animate={isSearchingDriver ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isSearchingDriver ? Infinity : 0, ease: "linear" }}
            className="w-12 h-12 bg-gradient-to-r from-primary to-primary-accent rounded-full flex items-center justify-center"
          >
            {isSearchingDriver ? (
              <Loader2 className="w-6 h-6 text-white" />
            ) : assignedDriver ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <Search className="w-6 h-6 text-white" />
            )}
          </motion.div>
          <div>
            <h3 className="font-bold text-lg">
              {isSearchingDriver ? 'Recherche de livreur...' : 
               assignedDriver ? 'Livreur assigné !' : 
               'En attente d\'assignation'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isSearchingDriver ? 'Nous trouvons le meilleur livreur pour vous' :
               assignedDriver ? `${assignedDriver.driver_profile?.display_name || 'Livreur professionnel'} arrive dans ${assignedDriver.estimated_arrival || '5-10 min'}` :
               'Veuillez patienter'}
            </p>
          </div>
        </div>

        {/* Timer display */}
        {validationTimer > 0 && assignedDriver && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-secondary/10 to-secondary-accent/10 rounded-xl p-4 mt-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-secondary" />
                <span className="font-medium">Temps de validation restant</span>
              </div>
              <motion.div
                key={validationTimer}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-secondary font-mono"
              >
                {formatTimer(validationTimer)}
              </motion.div>
            </div>
            <div className="mt-2">
              <Progress 
                value={(120 - validationTimer) / 120 * 100} 
                className="h-2"
              />
            </div>
          </motion.div>
        )}
      </Card>

      {/* Order summary */}
      <Card className="modern-glass-card p-6 border-0 shadow-xl">
        <h3 className="font-bold text-lg mb-4">Récapitulatif de la commande</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">Service</span>
            <span className="font-semibold">{deliveryModes.find(m => m.id === formData.mode)?.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">Distance</span>
            <span className="font-semibold">{formData.distance.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">Durée estimée</span>
            <span className="font-semibold">{formData.duration} min</span>
          </div>
          <div className="flex justify-between items-center py-3 text-xl">
            <span className="font-bold">Total</span>
            <span className="font-bold text-primary">{formData.estimatedPrice.toLocaleString()} CDF</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header with progress */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
              Annuler
            </Button>
            <h1 className="text-xl font-bold">Nouvelle livraison</h1>
            <div className="w-16" /> {/* Spacer */}
          </div>
          
          {/* Animated progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className={currentStep === 'locations' ? 'text-primary font-medium' : ''}>
                Adresses
              </span>
              <span className={currentStep === 'service' ? 'text-primary font-medium' : ''}>
                Service
              </span>
              <span className={currentStep === 'confirmation' ? 'text-primary font-medium' : ''}>
                Confirmation
              </span>
            </div>
            <Progress 
              value={getStepProgress()} 
              className="h-2 bg-muted/30"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {currentStep === 'locations' && <LocationStep key="locations" />}
          {currentStep === 'service' && <ServiceStep key="service" />}
          {currentStep === 'confirmation' && <ConfirmationStep key="confirmation" />}
        </AnimatePresence>
      </div>

      {/* Floating bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'locations'}
            className="flex items-center gap-2 modern-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </Button>

          {currentStep === 'confirmation' ? (
            <Button
              onClick={handleConfirmOrder}
              disabled={!assignedDriver}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-accent hover:from-primary/90 hover:to-primary-accent/90 modern-button"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmer la commande
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-accent hover:from-primary/90 hover:to-primary-accent/90 modern-button"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UltraModernDeliveryInterface;