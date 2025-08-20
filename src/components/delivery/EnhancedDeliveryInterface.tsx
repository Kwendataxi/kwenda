import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDeliveryOrders, DeliveryLocation } from '@/hooks/useEnhancedDeliveryOrders';
import { EnhancedLocationSearch } from './EnhancedLocationSearch';
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
  Building,
  Home,
  User,
  Phone,
  AlertCircle,
  Timer
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

interface EnhancedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const EnhancedDeliveryInterface = ({ onSubmit, onCancel }: EnhancedDeliveryInterfaceProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
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
    mode: 'flash',
    packageType: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    specialInstructions: ''
  });
  
  const [driverValidationTimer, setDriverValidationTimer] = useState<number | null>(null);
  const [foundDriver, setFoundDriver] = useState<any>(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [distance, setDistance] = useState(0);
  
  const { toast } = useToast();
  const { calculateDeliveryPrice, createDeliveryOrder, submitting } = useEnhancedDeliveryOrders();
  const timerRef = useRef<NodeJS.Timeout>();

  const slides = [
    { 
      id: 'pickup', 
      title: 'Point de récupération', 
      icon: Target,
      description: 'Où récupérer le colis ?' 
    },
    { 
      id: 'destination', 
      title: 'Point de livraison', 
      icon: MapPin,
      description: 'Où livrer le colis ?' 
    },
    { 
      id: 'package', 
      title: 'Détails du colis', 
      icon: Package,
      description: 'Informations sur votre envoi' 
    },
    { 
      id: 'mode', 
      title: 'Mode de livraison', 
      icon: Zap,
      description: 'Choisissez votre service' 
    },
    { 
      id: 'confirmation', 
      title: 'Confirmation', 
      icon: CheckCircle2,
      description: 'Vérifiez et confirmez' 
    }
  ];

  const deliveryModes = [
    {
      id: 'flash',
      name: 'Flash',
      subtitle: 'Moto ultra-rapide',
      icon: Bike,
      time: '15-30 min',
      description: 'Documents, petits colis légers',
      features: ['Livraison express', 'Jusqu\'à 5kg', 'Étanche'],
      maxWeight: 5,
      maxDimensions: { length: 30, width: 20, height: 15 }
    },
    {
      id: 'flex',
      name: 'Flex',
      subtitle: 'Camionnette confort',
      icon: Car,
      time: '30-60 min',
      description: 'Colis moyens et fragiles, volumes importants',
      features: ['Espace plus grand', 'Jusqu\'à 50kg', 'Protection optimale'],
      maxWeight: 50,
      maxDimensions: { length: 100, width: 80, height: 60 }
    },
    {
      id: 'maxicharge',
      name: 'MaxiCharge',
      subtitle: 'Camion gros volume',
      icon: Truck,
      time: '1-2h',
      description: 'Électroménager, meubles, charges lourdes',
      features: ['Assistant chargement', 'Jusqu\'à 500kg', 'Équipement spécialisé'],
      maxWeight: 500,
      maxDimensions: { length: 200, width: 150, height: 150 }
    }
  ];

  // Calcul automatique du prix quand les données changent
  useEffect(() => {
    const calculatePrice = async () => {
      if (formData.pickup.location && formData.destination.location) {
        try {
          const result = await calculateDeliveryPrice(
            formData.pickup.location, 
            formData.destination.location, 
            formData.mode
          );
          setEstimatedPrice(result.price);
          setDistance(result.distance);
        } catch (error) {
          console.error('Erreur calcul prix:', error);
        }
      }
    };

    calculatePrice();
  }, [formData.pickup.location, formData.destination.location, formData.mode]);

  // Gestion du timer de validation livreur (2 minutes)
  const startDriverValidationTimer = (driver: any) => {
    setFoundDriver(driver);
    setDriverValidationTimer(120); // 2 minutes
    
    const timer = setInterval(() => {
      setDriverValidationTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Rechercher un autre livreur
          searchAnotherDriver();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    timerRef.current = timer;
  };

  const searchAnotherDriver = () => {
    setFoundDriver(null);
    toast({
      title: "Recherche d'un autre livreur",
      description: "Nous cherchons un autre livreur disponible...",
    });
    
    // Simuler la recherche d'un nouveau livreur après 5 secondes
    setTimeout(() => {
      const newDriver = {
        id: Math.random().toString(),
        name: 'Jean-Paul Mukendi',
        rating: 4.8,
        vehicle: formData.mode === 'flash' ? 'Moto' : 'Camionnette',
        eta: Math.floor(Math.random() * 20) + 10
      };
      startDriverValidationTimer(newDriver);
    }, 5000);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
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

  const validateSlide = () => {
    switch (slides[currentSlide].id) {
      case 'pickup':
        return formData.pickup.location && formData.pickup.contact.name && formData.pickup.contact.phone;
      case 'destination':
        return formData.destination.location && formData.destination.contact.name && formData.destination.contact.phone;
      case 'package':
        return formData.packageType && formData.weight > 0;
      case 'mode':
        return formData.mode;
      default:
        return true;
    }
  };

  const handleConfirmOrder = async () => {
    if (!formData.pickup.location || !formData.destination.location) return;

    try {
      const orderData = {
        city: 'kinshasa', // À récupérer dynamiquement
        pickup: formData.pickup.location,
        destination: formData.destination.location,
        mode: formData.mode,
        packageType: formData.packageType,
        weight: formData.weight,
        dimensions: formData.dimensions,
        specialInstructions: formData.specialInstructions,
        estimatedPrice,
        distance,
        duration: Math.round(distance / 50000 * 3600),
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
      
      // Simuler l'assignation automatique du livreur
      setTimeout(() => {
        const assignedDriver = {
          id: 'driver_001',
          name: 'Pascal Mbuyi',
          rating: 4.9,
          vehicle: formData.mode === 'flash' ? 'Moto Yamaha' : 'Camionnette Toyota',
          eta: Math.floor(Math.random() * 15) + 5
        };
        startDriverValidationTimer(assignedDriver);
      }, 2000);

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
    }
  };

  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-xl border-b border-white/20 p-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={currentSlide > 0 ? handlePrevious : onCancel}
              className="p-3 hover:bg-white/20 rounded-full backdrop-blur-sm border border-white/20"
            >
              {currentSlide === 0 ? <Home className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">📦 Livraison Express</h1>
              <p className="text-sm text-muted-foreground">
                Étape {currentSlide + 1}/{slides.length} • {slides[currentSlide]?.title}
              </p>
            </div>
          </div>
          {foundDriver && driverValidationTimer && (
            <Badge className="bg-orange-500/20 text-orange-700 border-orange-300 animate-pulse">
              <Timer className="w-4 h-4 mr-1" />
              {Math.floor(driverValidationTimer / 60)}:{String(driverValidationTimer % 60).padStart(2, '0')}
            </Badge>
          )}
        </div>
        
        <Progress value={progress} className="h-2" />
      </div>

      {/* Contenu des slides */}
      <div className="flex-1 overflow-auto p-6">
        {/* Slide 1: Point de récupération */}
        {slides[currentSlide].id === 'pickup' && (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <Target className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Point de récupération</h2>
              <p className="text-muted-foreground">Où récupérer le colis ?</p>
            </div>

            <EnhancedLocationSearch
              value={formData.pickup.location}
              onChange={(location) => handleLocationSelect(location, 'pickup')}
              placeholder="Rechercher l'adresse de récupération..."
              cityContext={{
                name: 'Kinshasa',
                coordinates: [-4.4419, 15.2663],
                popular: ['Centre-ville', 'Gombe', 'Kinshasa', 'Lemba', 'Matete', 'Ngaliema']
              }}
              label="📍 Point de récupération"
              icon={<Target className="w-6 h-6 text-green-500" />}
            />

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact récupération
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Nom complet</Label>
                  <Input
                    value={formData.pickup.contact.name}
                    onChange={(e) => handleContactChange('name', e.target.value, 'pickup')}
                    placeholder="Ex: Jean Mukendi"
                  />
                </div>
                <div>
                  <Label className="text-sm">Téléphone</Label>
                  <Input
                    value={formData.pickup.contact.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value, 'pickup')}
                    placeholder="Ex: +243 XXX XXX XXX"
                  />
                </div>
                <div>
                  <Label className="text-sm">Instructions (optionnel)</Label>
                  <Textarea
                    value={formData.pickup.instructions}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, instructions: e.target.value }
                    }))}
                    placeholder="Ex: Sonner à l'interphone, 2ème étage..."
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Slide 2: Point de livraison */}
        {slides[currentSlide].id === 'destination' && (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Point de livraison</h2>
              <p className="text-muted-foreground">Où livrer le colis ?</p>
            </div>

            <EnhancedLocationSearch
              value={formData.destination.location}
              onChange={(location) => handleLocationSelect(location, 'destination')}
              placeholder="Rechercher l'adresse de livraison..."
              cityContext={{
                name: 'Kinshasa',
                coordinates: [-4.4419, 15.2663],
                popular: ['Centre-ville', 'Gombe', 'Kinshasa', 'Lemba', 'Matete', 'Ngaliema']
              }}
              label="🎯 Point de livraison"
              icon={<MapPin className="w-6 h-6 text-blue-500" />}
            />

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact livraison
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Nom complet</Label>
                  <Input
                    value={formData.destination.contact.name}
                    onChange={(e) => handleContactChange('name', e.target.value, 'destination')}
                    placeholder="Ex: Marie Tshala"
                  />
                </div>
                <div>
                  <Label className="text-sm">Téléphone</Label>
                  <Input
                    value={formData.destination.contact.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value, 'destination')}
                    placeholder="Ex: +243 XXX XXX XXX"
                  />
                </div>
                <div>
                  <Label className="text-sm">Instructions (optionnel)</Label>
                  <Textarea
                    value={formData.destination.instructions}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, instructions: e.target.value }
                    }))}
                    placeholder="Ex: Remettre au gardien, Bureau 205..."
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Slide 3: Détails du colis */}
        {slides[currentSlide].id === 'package' && (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <Package className="w-16 h-16 mx-auto text-purple-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Détails du colis</h2>
              <p className="text-muted-foreground">Informations sur votre envoi</p>
            </div>

            <Card className="p-4 space-y-4">
              <div>
                <Label className="text-sm">Type de colis</Label>
                <Input
                  value={formData.packageType}
                  onChange={(e) => setFormData(prev => ({ ...prev, packageType: e.target.value }))}
                  placeholder="Ex: Documents, Vêtements, Électronique..."
                />
              </div>
              
              <div>
                <Label className="text-sm">Poids approximatif (kg)</Label>
                <Input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 2.5"
                />
              </div>

              <div>
                <Label className="text-sm">Dimensions (cm) - Optionnel</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="L"
                    value={formData.dimensions.length || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, length: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="l"
                    value={formData.dimensions.width || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, width: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="H"
                    value={formData.dimensions.height || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, height: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Instructions spéciales</Label>
                <Textarea
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Ex: Fragile, à manipuler avec précaution..."
                  rows={3}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Slide 4: Mode de livraison */}
        {slides[currentSlide].id === 'mode' && (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <Zap className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Mode de livraison</h2>
              <p className="text-muted-foreground">Choisissez votre service</p>
            </div>

            <div className="space-y-3">
              {deliveryModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = formData.mode === mode.id;
                const isCompatible = formData.weight <= mode.maxWeight;
                
                return (
                  <Card
                    key={mode.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-2 border-primary bg-primary/5' 
                        : isCompatible 
                        ? 'hover:border-primary/50 hover:bg-primary/5' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => isCompatible && setFormData(prev => ({ ...prev, mode: mode.id as any }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-primary text-white' : 'bg-gray-100'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold">{mode.name}</h3>
                          <p className="text-sm text-muted-foreground">{mode.subtitle}</p>
                          <p className="text-xs text-muted-foreground">{mode.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Clock className="w-4 h-4 inline mr-1" />
                        <span className="text-sm font-medium">{mode.time}</span>
                        {!isCompatible && (
                          <div className="text-xs text-red-500 mt-1">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Trop lourd
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Slide 5: Confirmation */}
        {slides[currentSlide].id === 'confirmation' && (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Confirmation</h2>
              <p className="text-muted-foreground">Vérifiez vos informations</p>
            </div>

            <Card className="p-4 space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-semibold text-green-700">📍 Récupération</h3>
                <p className="text-sm">{formData.pickup.location?.address}</p>
                <p className="text-xs text-muted-foreground">
                  Contact: {formData.pickup.contact.name} - {formData.pickup.contact.phone}
                </p>
              </div>
              
              <div className="border-b pb-3">
                <h3 className="font-semibold text-blue-700">🎯 Livraison</h3>
                <p className="text-sm">{formData.destination.location?.address}</p>
                <p className="text-xs text-muted-foreground">
                  Contact: {formData.destination.contact.name} - {formData.destination.contact.phone}
                </p>
              </div>

              <div className="border-b pb-3">
                <h3 className="font-semibold">📦 Colis</h3>
                <p className="text-sm">{formData.packageType} - {formData.weight}kg</p>
                <p className="text-xs text-muted-foreground">
                  Mode: {deliveryModes.find(m => m.id === formData.mode)?.name}
                </p>
              </div>

              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Prix estimé:</span>
                  <span className="text-xl font-bold text-primary">{estimatedPrice.toLocaleString()} FC</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Distance: {distance.toFixed(1)} km</span>
                  <span>Durée: ~{Math.round(distance / 25 * 60)} min</span>
                </div>
              </div>
            </Card>

            {/* Driver Assignment Status */}
            {foundDriver && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800">{foundDriver.name}</h3>
                    <p className="text-sm text-green-600">
                      {foundDriver.rating}⭐ • {foundDriver.vehicle} • ETA: {foundDriver.eta} min
                    </p>
                    {driverValidationTimer && (
                      <p className="text-xs text-orange-600">
                        Validation: {Math.floor(driverValidationTimer / 60)}:{String(driverValidationTimer % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 bg-white/10 backdrop-blur-xl border-t border-white/20 flex-shrink-0">
        <div className="flex justify-between max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="flex-1 mr-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentSlide === slides.length - 1 ? (
            <Button
              onClick={handleConfirmOrder}
              disabled={!validateSlide() || submitting}
              className="flex-1 ml-2"
            >
              {submitting ? 'Création...' : 'Confirmer'}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!validateSlide()}
              className="flex-1 ml-2"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDeliveryInterface;