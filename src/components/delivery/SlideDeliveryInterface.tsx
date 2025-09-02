import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { 
  ArrowLeft,
  MapPin, 
  Target,
  CheckCircle2,
  Package,
  Zap,
  Truck,
  Search,
  Loader2
} from 'lucide-react';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface DeliveryFormData {
  packageType: 'small' | 'medium' | 'large';
  pickup: { location: LocationData | null; name: string; phone: string };
  destination: { location: LocationData | null; name: string; phone: string };
  serviceMode: 'flash' | 'flex' | 'maxicharge' | null;
}

interface SlideDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const packageTypes = [
  { id: 'small', icon: Package, label: 'Petit' },
  { id: 'medium', icon: Package, label: 'Moyen' },
  { id: 'large', icon: Package, label: 'Gros' }
];

const services = [
  { id: 'flash', icon: Zap, label: 'Flash', subtitle: '30min', price: 5000 },
  { id: 'flex', icon: Package, label: 'Flex', subtitle: '1-2h', price: 3000 },
  { id: 'maxicharge', icon: Truck, label: 'MaxiCharge', subtitle: '2-4h', price: 8000 }
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0 })
};

const SlideDeliveryInterface: React.FC<SlideDeliveryInterfaceProps> = ({ onSubmit, onCancel }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<DeliveryFormData>({
    packageType: 'medium',
    pickup: { location: null, name: '', phone: '' },
    destination: { location: null, name: '', phone: '' },
    serviceMode: null
  });
  const [queries, setQueries] = useState({ pickup: '', destination: '' });
  const [suggestions, setSuggestions] = useState<{ pickup: LocationData[]; destination: LocationData[] }>({ pickup: [], destination: [] });

  const { toast } = useToast();
  const { searchLocation, getCurrentPosition, loading: locationLoading } = useMasterLocation();
  const { createDeliveryOrder, submitting } = useEnhancedDeliveryOrders();

  const nextSlide = () => {
    if (currentSlide < 2) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide(prev => prev - 1);
  };

  const useCurrentLocation = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      if (position) {
        const location: LocationData = {
          address: position.address,
          lat: position.lat,
          lng: position.lng
        };
        setFormData(prev => ({ ...prev, pickup: { ...prev.pickup, location } }));
        setQueries(prev => ({ ...prev, pickup: position.address }));
        toast({ title: "Position détectée", description: `📍 ${position.address.substring(0, 30)}...` });
      }
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Veuillez saisir l'adresse manuellement",
        variant: "destructive"
      });
    }
  }, [getCurrentPosition, toast]);

  const handleSearch = useCallback(async (query: string, type: 'pickup' | 'destination') => {
    setQueries(prev => ({ ...prev, [type]: query }));
    
    if (query.length < 2) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    try {
      const results = await searchLocation(query);
      setSuggestions(prev => ({ ...prev, [type]: results }));
    } catch (error) {
      const fallback = [
        { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167 },
        { address: `${query}, Centre-ville`, lat: -4.3217, lng: 15.3069 }
      ];
      setSuggestions(prev => ({ ...prev, [type]: fallback }));
    }
  }, [searchLocation]);

  const selectLocation = (location: LocationData, type: 'pickup' | 'destination') => {
    setFormData(prev => ({ 
      ...prev, 
      [type]: { ...prev[type], location } 
    }));
    setQueries(prev => ({ ...prev, [type]: location.address }));
    setSuggestions(prev => ({ ...prev, [type]: [] }));
  };

  const handleSubmit = async () => {
    if (!formData.pickup.location || !formData.destination.location || !formData.serviceMode) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        city: 'kinshasa',
        pickup: formData.pickup.location,
        destination: formData.destination.location,
        mode: formData.serviceMode,
        estimatedPrice: services.find(s => s.id === formData.serviceMode)?.price || 0,
        distance: 5,
        duration: 30
      };

      const orderId = await createDeliveryOrder(orderData);
      toast({
        title: "Commande créée !",
        description: "Recherche d'un chauffeur en cours...",
      });
      onSubmit({ ...orderData, id: orderId });
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  const canProceed = () => {
    if (currentSlide === 0) return true;
    if (currentSlide === 1) return formData.pickup.location && formData.destination.location;
    return formData.serviceMode;
  };

  // Slide 1: Type de colis
  const PackageSlide = () => (
    <motion.div
      key="package"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-bold text-center">Type de colis</h2>
      <div className="grid grid-cols-3 gap-2">
        {packageTypes.map((type) => (
          <Card
            key={type.id}
            className={`p-3 cursor-pointer text-center h-20 flex flex-col justify-center ${
              formData.packageType === type.id ? 'ring-2 ring-primary bg-primary/10' : ''
            }`}
            onClick={() => {
              setFormData(prev => ({ ...prev, packageType: type.id as any }));
              setTimeout(nextSlide, 200);
            }}
          >
            <type.icon className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs font-medium">{type.label}</span>
          </Card>
        ))}
      </div>
    </motion.div>
  );

  // Slide 2: Adresses
  const AddressSlide = () => (
    <motion.div
      key="address"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-bold text-center">Adresses</h2>
      
      {/* Pickup */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Récupérer</span>
        </div>
        
        <Button
          variant="outline"
          onClick={useCurrentLocation}
          disabled={locationLoading}
          className="w-full h-10 text-xs"
        >
          {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
          Ma position
        </Button>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Adresse de récupération"
            value={queries.pickup}
            onChange={(e) => handleSearch(e.target.value, 'pickup')}
            className="pl-8 h-9 text-sm"
          />
          {suggestions.pickup.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-32 overflow-y-auto">
              {suggestions.pickup.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => selectLocation(suggestion, 'pickup')}
                >
                  {suggestion.address.substring(0, 40)}...
                </div>
              ))}
            </Card>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nom"
            value={formData.pickup.name}
            onChange={(e) => setFormData(prev => ({ ...prev, pickup: { ...prev.pickup, name: e.target.value } }))}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Téléphone"
            value={formData.pickup.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, pickup: { ...prev.pickup, phone: e.target.value } }))}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium">Livrer</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Adresse de livraison"
            value={queries.destination}
            onChange={(e) => handleSearch(e.target.value, 'destination')}
            className="pl-8 h-9 text-sm"
          />
          {suggestions.destination.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-32 overflow-y-auto">
              {suggestions.destination.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => selectLocation(suggestion, 'destination')}
                >
                  {suggestion.address.substring(0, 40)}...
                </div>
              ))}
            </Card>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nom"
            value={formData.destination.name}
            onChange={(e) => setFormData(prev => ({ ...prev, destination: { ...prev.destination, name: e.target.value } }))}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Téléphone"
            value={formData.destination.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, destination: { ...prev.destination, phone: e.target.value } }))}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </motion.div>
  );

  // Slide 3: Service + Confirmation
  const ServiceSlide = () => (
    <motion.div
      key="service"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-bold text-center">Service</h2>
      
      <div className="space-y-2">
        {services.map((service) => (
          <Card
            key={service.id}
            className={`p-3 cursor-pointer ${
              formData.serviceMode === service.id ? 'ring-2 ring-primary bg-primary/10' : ''
            }`}
            onClick={() => setFormData(prev => ({ ...prev, serviceMode: service.id as any }))}
          >
            <div className="flex items-center gap-3">
              <service.icon className="h-5 w-5" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{service.label}</span>
                  <span className="text-sm font-bold">{service.price} CDF</span>
                </div>
                <span className="text-xs text-muted-foreground">{service.subtitle}</span>
              </div>
              {formData.serviceMode === service.id && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Résumé */}
      {formData.pickup.location && formData.destination.location && (
        <Card className="p-3 bg-muted/50">
          <div className="text-xs space-y-1">
            <div><strong>De:</strong> {formData.pickup.location.address.substring(0, 30)}...</div>
            <div><strong>À:</strong> {formData.destination.location.address.substring(0, 30)}...</div>
            <div><strong>Type:</strong> {packageTypes.find(p => p.id === formData.packageType)?.label}</div>
          </div>
        </Card>
      )}
    </motion.div>
  );

  const slides = [PackageSlide, AddressSlide, ServiceSlide];
  const CurrentSlide = slides[currentSlide];

  return (
    <div className="bg-background p-4 pb-24 max-h-screen overflow-y-auto">
      <div className="max-w-sm mx-auto">
        {/* Header compact */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={currentSlide === 0 ? onCancel : prevSlide}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Étape {currentSlide + 1}/3
          </div>
          <div className="w-8" />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1 mb-6">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / 3) * 100}%` }}
          />
        </div>

        {/* Slide content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <CurrentSlide />
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          {currentSlide < 2 ? (
            <Button 
              onClick={nextSlide} 
              disabled={!canProceed()}
              className="flex-1"
            >
              Suivant
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !canProceed()}
              className="flex-1"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Commander'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideDeliveryInterface;