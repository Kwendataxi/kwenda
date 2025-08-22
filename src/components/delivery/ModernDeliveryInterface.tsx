import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
// import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';

interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}
import { EnhancedLocationSearch } from './EnhancedLocationSearch';
import { useDriverAssignment } from '@/hooks/useDriverAssignment';
import { useMasterLocation } from '@/hooks/useMasterLocation';
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
  Home,
  User,
  Phone,
  Timer,
  Search,
  Star,
  Navigation,
  Shield,
  Gauge
} from 'lucide-react';

interface ContactInfo {
  name: string;
  phone: string;
}

interface DeliveryFormData {
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
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  specialInstructions: string;
}

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DeliveryFormData>({
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
    dimensions: { length: 0, width: 0, height: 0 },
    specialInstructions: ''
  });
  
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [distance, setDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [validationTimer, setValidationTimer] = useState<number>(0);
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  
  const { toast } = useToast();
  // const { calculateDeliveryPrice, createDeliveryOrder, submitting } = useEnhancedDeliveryOrders();
  const calculateDeliveryPrice = (from: any, to: any, mode: string) => ({ price: 2500, distance: 3.5, duration: 25 });
  const createDeliveryOrder = async (data: any) => `order_${Date.now()}`;
  const submitting = false;
  const { findAvailableDrivers, assignDriverToDelivery } = useDriverAssignment();
  const masterLocation = useMasterLocation();
  const getCurrentLocation = masterLocation.getCurrentPosition;
  const isLocationEnabled = true; // masterLocation.isLocationEnabled;
  const timerRef = useRef<NodeJS.Timeout>();

  // Étapes simplifiées à 3 phases
  const steps = [
    { 
      id: 'locations', 
      title: 'Adresses', 
      subtitle: 'Départ et destination',
      icon: MapPin,
      progress: 33
    },
    { 
      id: 'service', 
      title: 'Service', 
      subtitle: 'Type de livraison et colis',
      icon: Package,
      progress: 66
    },
    { 
      id: 'confirmation', 
      title: 'Confirmation', 
      subtitle: 'Finalisation et assignation',
      icon: CheckCircle2,
      progress: 100
    }
  ];

  const deliveryModes = [
    {
      id: 'flash',
      name: 'Flash',
      subtitle: 'Livraison ultra-rapide',
      icon: Bike,
      time: '15-30 min',
      description: 'Moto express pour documents et petits colis',
      features: ['Jusqu\'à 5kg', 'Étanche', 'GPS temps réel'],
      price: '+50%',
      color: 'from-orange-500 to-red-500',
      maxWeight: 5,
      vehicleType: 'moto'
    },
    {
      id: 'flex',
      name: 'Flex',
      subtitle: 'Équilibre parfait',
      icon: Car,
      time: '30-60 min',
      description: 'Camionnette confortable pour tous vos besoins',
      features: ['Jusqu\'à 50kg', 'Protection optimale', 'Volume important'],
      price: 'Standard',
      color: 'from-blue-500 to-purple-500',
      maxWeight: 50,
      vehicleType: 'car'
    },
    {
      id: 'maxicharge',
      name: 'MaxiCharge',
      subtitle: 'Gros volume garanti',
      icon: Truck,
      time: '1-2h',
      description: 'Camion équipé pour électroménager et meubles',
      features: ['Jusqu\'à 500kg', 'Assistant chargement', 'Équipement pro'],
      price: '+100%',
      color: 'from-green-500 to-teal-500',
      maxWeight: 500,
      vehicleType: 'truck'
    }
  ];

  // Auto-géolocalisation au montage
  useEffect(() => {
    const initializeLocation = async () => {
      if (isLocationEnabled) {
        try {
          const currentPos = await getCurrentLocation();
          if (currentPos) {
            setFormData(prev => ({
              ...prev,
              pickup: {
                ...prev.pickup,
                location: {
                  address: currentPos.address,
                  coordinates: { lat: currentPos.lat, lng: currentPos.lng }
                }
              }
            }));
            toast({
              title: "Position détectée",
              description: "Votre position a été automatiquement définie comme point de départ",
            });
          }
        } catch (error) {
          console.log('Géolocalisation non disponible');
        }
      }
    };

    initializeLocation();
  }, [getCurrentLocation, isLocationEnabled]);

  // Calcul automatique du prix
  useEffect(() => {
    const calculateEstimates = async () => {
      if (formData.pickup.location && formData.destination.location) {
        try {
          const result = await calculateDeliveryPrice(
            formData.pickup.location, 
            formData.destination.location, 
            formData.mode
          );
          setEstimatedPrice(result.price);
          setDistance(result.distance);
          setEstimatedTime(result.duration);
        } catch (error) {
          console.error('Erreur calcul prix:', error);
        }
      }
    };

    calculateEstimates();
  }, [formData.pickup.location, formData.destination.location, formData.mode]);

  // Timer de validation livreur (2 minutes animées)
  const startValidationTimer = (driver: any) => {
    setAssignedDriver(driver);
    setValidationTimer(120);
    
    const timer = setInterval(() => {
      setValidationTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          searchNewDriver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    timerRef.current = timer;
  };

  const searchNewDriver = async () => {
    setAssignedDriver(null);
    setIsSearchingDriver(true);
    
    try {
      const drivers = await findAvailableDrivers({
        pickup_location: formData.pickup.location!.address,
        pickup_coordinates: { 
          lat: formData.pickup.location!.coordinates.lat, 
          lng: formData.pickup.location!.coordinates.lng 
        },
        destination: formData.destination.location!.address,
        destination_coordinates: { 
          lat: formData.destination.location!.coordinates.lat, 
          lng: formData.destination.location!.coordinates.lng 
        },
        service_type: formData.mode,
        vehicle_class: deliveryModes.find(m => m.id === formData.mode)?.vehicleType || 'car'
      });

      if (drivers.length > 0) {
        const bestDriver = drivers[0];
        startValidationTimer(bestDriver);
        toast({
          title: "Nouveau livreur trouvé",
          description: `${bestDriver.driver_profile.display_name} peut vous livrer`,
        });
      } else {
        toast({
          title: "Aucun livreur disponible",
          description: "Nous continuons la recherche...",
          variant: "destructive"
        });
        // Retry après 30 secondes
        setTimeout(searchNewDriver, 30000);
      }
    } catch (error) {
      console.error('Erreur recherche livreur:', error);
    } finally {
      setIsSearchingDriver(false);
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (steps[currentStep].id) {
      case 'locations':
        return formData.pickup.location && 
               formData.destination.location && 
               formData.pickup.contact.name && 
               formData.pickup.contact.phone &&
               formData.destination.contact.name && 
               formData.destination.contact.phone;
      case 'service':
        return formData.mode && formData.packageType && formData.weight > 0;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const handleLocationSelect = (location: DeliveryLocation, type: 'pickup' | 'destination') => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        location
      }
    }));
  };

  const handleContactChange = (field: string, value: string, type: 'pickup' | 'destination') => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        contact: {
          ...prev[type].contact,
          [field]: value
        }
      }
    }));
  };

  const handleModeSelect = (mode: 'flash' | 'flex' | 'maxicharge') => {
    setFormData(prev => ({ ...prev, mode }));
  };

  const handleConfirmOrder = async () => {
    if (!formData.pickup.location || !formData.destination.location) return;

    setIsSearchingDriver(true);

    try {
      // Créer la commande d'abord
      const orderData = {
        city: 'kinshasa',
        pickup: formData.pickup.location,
        destination: formData.destination.location,
        mode: formData.mode,
        packageType: formData.packageType,
        weight: formData.weight,
        dimensions: formData.dimensions,
        specialInstructions: formData.specialInstructions,
        estimatedPrice,
        distance,
        duration: estimatedTime,
        contacts: {
          pickup: formData.pickup.contact,
          destination: formData.destination.contact
        },
        instructions: {
          pickup: formData.pickup.instructions,
          destination: formData.destination.instructions
        }
      };

      const orderId = await createDeliveryOrder(orderData);
      
      // Rechercher et assigner un livreur
      await searchNewDriver();

      onSubmit({
        orderId,
        ...orderData
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        variant: 'destructive'
      });
      setIsSearchingDriver(false);
    }
  };

  const StepProgress = () => (
    <div className="relative flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <motion.div
            className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${
              index <= currentStep 
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' 
                : 'bg-muted text-muted-foreground border-2 border-muted'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <step.icon className="w-6 h-6" />
          </motion.div>
          {index < steps.length - 1 && (
            <div className={`w-20 h-1 mx-2 rounded-full transition-colors ${
              index < currentStep ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header moderne */}
      <motion.div 
        className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={currentStep > 0 ? handlePrevious : onCancel}
                className="hover:scale-105 transition-transform"
              >
                {currentStep === 0 ? <Home className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  🚚 Livraison Express
                </h1>
                <p className="text-sm text-muted-foreground">
                  {steps[currentStep].title} • {steps[currentStep].subtitle}
                </p>
              </div>
            </div>
            
            {/* Timer de validation animé */}
            {assignedDriver && validationTimer > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-orange-500/10 text-orange-600 px-3 py-2 rounded-full border border-orange-200"
              >
                <Timer className="w-4 h-4 animate-pulse" />
                <span className="font-mono text-sm">
                  {Math.floor(validationTimer / 60)}:{String(validationTimer % 60).padStart(2, '0')}
                </span>
              </motion.div>
            )}
          </div>
          
          <StepProgress />
          <Progress value={steps[currentStep].progress} className="h-2 bg-muted" />
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="max-w-2xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {/* ÉTAPE 1: Adresses de départ et destination */}
          {steps[currentStep].id === 'locations' && (
            <motion.div
              key="locations"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", damping: 20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <MapPin className="w-20 h-20 mx-auto text-primary mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Où récupérer et livrer ?</h2>
                <p className="text-muted-foreground">Définissez vos adresses et contacts</p>
              </div>

              <div className="grid gap-6">
                {/* Point de récupération */}
                <Card className="p-6 border-2 border-dashed border-green-200 bg-green-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">Point de récupération</h3>
                  </div>
                  
                   <EnhancedLocationSearch
                     value={formData.pickup.location}
                     onChange={(location) => handleLocationSelect({
                       address: location.address,
                       coordinates: location.coordinates
                     }, 'pickup')}
                     placeholder="Où récupérer le colis..."
                     cityContext={{
                       name: 'Kinshasa',
                       coordinates: [-4.4419, 15.2663],
                       popular: ['Centre-ville', 'Gombe', 'Kinshasa', 'Lemba', 'Matete', 'Ngaliema']
                     }}
                   />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Nom complet</Label>
                      <Input
                        value={formData.pickup.contact.name}
                        onChange={(e) => handleContactChange('name', e.target.value, 'pickup')}
                        placeholder="Jean Mukendi"
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        value={formData.pickup.contact.phone}
                        onChange={(e) => handleContactChange('phone', e.target.value, 'pickup')}
                        placeholder="+243 XXX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Instructions (optionnel)</Label>
                    <Textarea
                      value={formData.pickup.instructions}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pickup: { ...prev.pickup, instructions: e.target.value }
                      }))}
                      placeholder="Sonnez à l'interphone, 2ème étage..."
                      rows={2}
                    />
                  </div>
                </Card>

                {/* Point de livraison */}
                <Card className="p-6 border-2 border-dashed border-blue-200 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">Point de livraison</h3>
                  </div>
                  
                   <EnhancedLocationSearch
                     value={formData.destination.location}
                     onChange={(location) => handleLocationSelect({
                       address: location.address,
                       coordinates: location.coordinates
                     }, 'destination')}
                     placeholder="Où livrer le colis..."
                     cityContext={{
                       name: 'Kinshasa',
                       coordinates: [-4.4419, 15.2663],
                       popular: ['Centre-ville', 'Gombe', 'Kinshasa', 'Lemba', 'Matete', 'Ngaliema']
                     }}
                   />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Nom complet</Label>
                      <Input
                        value={formData.destination.contact.name}
                        onChange={(e) => handleContactChange('name', e.target.value, 'destination')}
                        placeholder="Marie Tshala"
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        value={formData.destination.contact.phone}
                        onChange={(e) => handleContactChange('phone', e.target.value, 'destination')}
                        placeholder="+243 XXX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Instructions (optionnel)</Label>
                    <Textarea
                      value={formData.destination.instructions}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        destination: { ...prev.destination, instructions: e.target.value }
                      }))}
                      placeholder="Remettre au gardien, Bureau 205..."
                      rows={2}
                    />
                  </div>
                </Card>

                {/* Estimation distance/prix préliminaire */}
                {distance > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 text-center"
                  >
                    <div className="flex justify-center items-center gap-6">
                      <div>
                        <Navigation className="w-6 h-6 mx-auto text-primary mb-1" />
                        <p className="text-sm font-medium">{distance.toFixed(1)} km</p>
                      </div>
                      <div>
                        <Clock className="w-6 h-6 mx-auto text-primary mb-1" />
                        <p className="text-sm font-medium">≈ {estimatedTime} min</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 2: Service et colis */}
          {steps[currentStep].id === 'service' && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", damping: 20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Package className="w-20 h-20 mx-auto text-primary mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Choisissez votre service</h2>
                <p className="text-muted-foreground">Type de livraison et détails du colis</p>
              </div>

              {/* Modes de livraison avec nouvelles fonctionnalités */}
              <div className="grid gap-4">
                {deliveryModes.map((mode) => {
                  const isSelected = formData.mode === mode.id;
                  const isCompatible = formData.weight <= mode.maxWeight;
                  
                  return (
                    <motion.div
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`p-6 cursor-pointer transition-all relative overflow-hidden ${
                          isSelected 
                            ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                            : 'hover:shadow-md hover:bg-muted/30'
                        } ${!isCompatible ? 'opacity-50' : ''}`}
                        onClick={() => isCompatible && handleModeSelect(mode.id as any)}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-5`} />
                        
                        <div className="relative flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${mode.color} text-white`}>
                            <mode.icon className="w-8 h-8" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold">{mode.name}</h3>
                                <p className="text-sm text-muted-foreground">{mode.subtitle}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={mode.price === 'Standard' ? 'default' : 'secondary'}>
                                  {mode.price}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">{mode.time}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm mb-3">{mode.description}</p>
                            
                            <div className="flex flex-wrap gap-2">
                              {mode.features.map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4"
                          >
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          </motion.div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Détails du colis */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Détails du colis
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Type de colis</Label>
                    <Input
                      value={formData.packageType}
                      onChange={(e) => setFormData(prev => ({ ...prev, packageType: e.target.value }))}
                      placeholder="Documents, Vêtements, Électronique..."
                    />
                  </div>
                  
                  <div>
                    <Label>Poids (kg)</Label>
                    <Input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <Label>Instructions spéciales</Label>
                    <Textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      placeholder="Fragile, urgent..."
                      rows={1}
                    />
                  </div>
                </div>
              </Card>

              {/* Estimation de prix en temps réel */}
              {estimatedPrice > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Estimation de prix</h3>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {new Intl.NumberFormat('fr-CD').format(estimatedPrice)} CDF
                    </div>
                    <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
                      <span>📏 {distance.toFixed(1)} km</span>
                      <span>⏱️ ≈ {estimatedTime} min</span>
                      <span>🚚 {deliveryModes.find(m => m.id === formData.mode)?.name}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ÉTAPE 3: Confirmation et assignation */}
          {steps[currentStep].id === 'confirmation' && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", damping: 20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle2 className="w-20 h-20 mx-auto text-green-500 mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Confirmation de livraison</h2>
                <p className="text-muted-foreground">Vérifiez et validez votre commande</p>
              </div>

              {/* Résumé de la commande */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Point de récupération</p>
                      <p className="text-sm text-muted-foreground">{formData.pickup.location?.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Contact: {formData.pickup.contact.name} - {formData.pickup.contact.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Point de livraison</p>
                      <p className="text-sm text-muted-foreground">{formData.destination.location?.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Contact: {formData.destination.contact.name} - {formData.destination.contact.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Colis: {formData.packageType}</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.weight}kg • Service {deliveryModes.find(m => m.id === formData.mode)?.name}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Prix final */}
              <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Prix total</h3>
                  <div className="text-5xl font-bold text-primary mb-4">
                    {new Intl.NumberFormat('fr-CD').format(estimatedPrice)} CDF
                  </div>
                  <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
                    <span>📏 {distance.toFixed(1)} km</span>
                    <span>⏱️ ≈ {estimatedTime} min</span>
                  </div>
                </div>
              </Card>

              {/* Statut recherche/assignation livreur */}
              {isSearchingDriver && !assignedDriver && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-8"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 mx-auto mb-4"
                  >
                    <Search className="w-12 h-12 text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">Recherche d'un livreur...</h3>
                  <p className="text-muted-foreground">
                    Nous cherchons le meilleur livreur disponible dans votre zone
                  </p>
                </motion.div>
              )}

              {/* Livreur assigné avec timer */}
              {assignedDriver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-800">Livreur assigné</h3>
                    <Badge className="bg-green-500/20 text-green-700">
                      <Timer className="w-4 h-4 mr-1" />
                      {Math.floor(validationTimer / 60)}:{String(validationTimer % 60).padStart(2, '0')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {assignedDriver.driver_profile?.display_name?.charAt(0) || 'L'}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {assignedDriver.driver_profile?.display_name || 'Livreur Kwenda'}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {assignedDriver.driver_profile?.rating_average?.toFixed(1) || '4.8'}
                        </span>
                        <span>📍 {assignedDriver.distance?.toFixed(1) || '1.2'} km</span>
                        <span>⏱️ {assignedDriver.estimated_arrival || '8'} min</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        🚗 {assignedDriver.driver_profile?.vehicle_make} {assignedDriver.driver_profile?.vehicle_model}
                      </p>
                    </div>
                  </div>

                  {/* Progress circulaire pour le timer */}
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-green-200"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                          className="text-green-500"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          initial={{ strokeDashoffset: 0 }}
                          animate={{ 
                            strokeDashoffset: `${2 * Math.PI * 40 * (1 - validationTimer / 120)}`
                          }}
                          transition={{ duration: 1 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-600">
                          {validationTimer}s
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons de navigation */}
        <motion.div 
          className="flex justify-between items-center mt-8 pt-6 border-t"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!validateCurrentStep()}
              className="flex items-center gap-2 hover:scale-105 transition-transform bg-gradient-to-r from-primary to-secondary"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirmOrder}
              disabled={submitting || isSearchingDriver}
              className="flex items-center gap-2 hover:scale-105 transition-transform bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              {submitting || isSearchingDriver ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Search className="w-4 h-4" />
                  </motion.div>
                  Recherche...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmer la livraison
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ModernDeliveryInterface;