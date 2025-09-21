import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Star, Package, Navigation, CheckCircle, Truck, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Location {
  id: string;
  name: string;
  address: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Lieux populaires de Kinshasa avec coordonnées précises
const KINSHASA_POPULAR_PLACES: Location[] = [
  {
    id: '1',
    name: 'Université de Kinshasa (UNIKIN)',
    address: 'Campus universitaire, Mont-Amba, Lemba',
    category: 'Éducation',
    coordinates: { lat: -4.3726, lng: 15.3678 }
  },
  {
    id: '2', 
    name: 'Marché Central',
    address: 'Avenue Tombalbaye, Centre-ville, Gombe',
    category: 'Commerce',
    coordinates: { lat: -4.3150, lng: 15.3100 }
  },
  {
    id: '3',
    name: 'Aéroport International N\'djili',
    address: 'N\'djili International Airport, Nsele',
    category: 'Transport',
    coordinates: { lat: -4.3857, lng: 15.4446 }
  },
  {
    id: '4',
    name: 'Place de l\'Indépendance',
    address: 'Boulevard du 30 Juin, Gombe',
    category: 'Monument',
    coordinates: { lat: -4.3217, lng: 15.3069 }
  },
  {
    id: '5',
    name: 'Hôtel Memling',
    address: 'Avenue des Aviateurs, Gombe',
    category: 'Hôtellerie',
    coordinates: { lat: -4.3200, lng: 15.3050 }
  },
  {
    id: '6',
    name: 'Stade des Martyrs',
    address: 'Commune de Kalamu',
    category: 'Sport',
    coordinates: { lat: -4.3500, lng: 15.3200 }
  },
  {
    id: '7',
    name: 'Marché de la Liberté',
    address: 'Kintambo, Kalamu',
    category: 'Commerce',
    coordinates: { lat: -4.3400, lng: 15.2900 }
  },
  {
    id: '8',
    name: 'Cathédrale Notre-Dame du Congo',
    address: 'Lingwala, Kinshasa',
    category: 'Religion',
    coordinates: { lat: -4.3250, lng: 15.3150 }
  }
];

const DELIVERY_SERVICES = [
  { 
    id: 'flash', 
    name: 'Flash', 
    desc: 'Livraison express en 30 minutes', 
    price: 5000,
    icon: Zap,
    color: 'congo-red',
    time: '30 min'
  },
  { 
    id: 'flex', 
    name: 'Flex', 
    desc: 'Livraison standard en 2 heures', 
    price: 3000,
    icon: Truck,
    color: 'congo-blue',
    time: '2 heures'
  },
  { 
    id: 'maxicharge', 
    name: 'Maxicharge', 
    desc: 'Gros colis en 4 heures', 
    price: 8000,
    icon: Package,
    color: 'congo-green',
    time: '4 heures'
  }
];

interface UltraModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function UltraModernDeliveryInterface({ onSubmit, onCancel }: UltraModernDeliveryInterfaceProps) {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [delivery, setDelivery] = useState<Location | null>(null);
  const [deliveryType, setDeliveryType] = useState<'flash' | 'flex' | 'maxicharge'>('flex');
  const [currentStep, setCurrentStep] = useState<'pickup' | 'delivery' | 'service' | 'confirm'>('pickup');
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLocationSelect = useCallback((location: Location) => {
    if (currentStep === 'pickup') {
      setPickup(location);
      setCurrentStep('delivery');
    } else if (currentStep === 'delivery') {
      setDelivery(location);
      setCurrentStep('service');
    }
  }, [currentStep]);

  const handleCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    
    // Simulation de géolocalisation avec fallback immédiat
    setTimeout(() => {
      const currentLoc: Location = {
        id: 'current',
        name: 'Ma position actuelle',
        address: 'Position GPS détectée',
        category: 'Géolocalisation',
        coordinates: { lat: -4.3217, lng: 15.3069 } // Centre de Kinshasa par défaut
      };
      
      handleLocationSelect(currentLoc);
      setIsLocating(false);
    }, 800);
  }, [handleLocationSelect]);

  const handleServiceSelect = useCallback((service: 'flash' | 'flex' | 'maxicharge') => {
    setDeliveryType(service);
    setCurrentStep('confirm');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!pickup || !delivery) return;
    
    const selectedService = DELIVERY_SERVICES.find(s => s.id === deliveryType);
    
    const orderData = {
      orderId: `KWD${Date.now()}`,
      pickup_location: pickup.address,
      pickup_coordinates: pickup.coordinates,
      delivery_location: delivery.address,
      delivery_coordinates: delivery.coordinates,
      delivery_type: deliveryType,
      estimated_price: selectedService?.price || 3000,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    onSubmit(orderData);
  }, [pickup, delivery, deliveryType, onSubmit]);

  const filteredPlaces = searchQuery 
    ? KINSHASA_POPULAR_PLACES.filter(place => 
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : KINSHASA_POPULAR_PLACES;

  const selectedService = DELIVERY_SERVICES.find(s => s.id === deliveryType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-congo-blue/5 rounded-full blur-xl animate-float" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-congo-red/5 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-congo-yellow/5 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header avec glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-20 glassmorphism border-b border-white/10 p-4"
        >
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-congo-blue to-congo-red rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-congo-blue to-congo-red bg-clip-text text-transparent">
                  Kwenda Delivery
                </h1>
                <p className="text-xs text-muted-foreground">Service ultra-rapide</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="flex-1 p-4 max-w-lg mx-auto w-full">
          {/* Progress indicator moderne */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-6"
          >
            <div className="flex items-center gap-2">
              {['pickup', 'delivery', 'service', 'confirm'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                    currentStep === step 
                      ? "bg-congo-blue text-white shadow-lg scale-110" 
                      : ['pickup', 'delivery', 'service', 'confirm'].indexOf(currentStep) > index
                      ? "bg-congo-green text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {['pickup', 'delivery', 'service', 'confirm'].indexOf(currentStep) > index ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-1 transition-all duration-300",
                      ['pickup', 'delivery', 'service', 'confirm'].indexOf(currentStep) > index 
                        ? "bg-congo-green" 
                        : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Étape 1: Pickup */}
            {currentStep === 'pickup' && (
              <motion.div
                key="pickup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glassmorphism border-white/10 shadow-xl">
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold mb-2">Point de collecte</h2>
                      <p className="text-sm text-muted-foreground">Où récupérer votre colis ?</p>
                    </div>

                    {/* Bouton géolocalisation */}
                    <Button
                      variant="outline"
                      className="w-full h-12 mb-6 glassmorphism-light border-congo-blue/30 hover:bg-congo-blue/10 transition-all duration-300"
                      onClick={handleCurrentLocation}
                      disabled={isLocating}
                    >
                      {isLocating ? (
                        <div className="w-4 h-4 mr-3 border-2 border-congo-blue border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4 mr-3 text-congo-blue" />
                      )}
                      <span>Ma position actuelle</span>
                    </Button>

                    {/* Barre de recherche */}
                    <div className="mb-4">
                      <Input
                        placeholder="Rechercher un lieu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glassmorphism-light border-white/20"
                      />
                    </div>

                    {/* Lieux populaires */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Lieux populaires</h3>
                      {filteredPlaces.map((place) => (
                        <motion.div
                          key={place.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="ghost"
                            className="w-full h-auto p-3 justify-start glassmorphism-light border border-white/10 hover:border-congo-blue/30 transition-all"
                            onClick={() => handleLocationSelect(place)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <Star className="w-4 h-4 text-congo-yellow mt-1 flex-shrink-0" />
                              <div className="text-left flex-1">
                                <div className="font-medium text-sm mb-1">{place.name}</div>
                                <p className="text-xs text-muted-foreground">{place.address}</p>
                                <span className="inline-block text-xs bg-congo-blue/20 text-congo-blue px-2 py-0.5 rounded-full mt-1">
                                  {place.category}
                                </span>
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Étape 2: Delivery */}
            {currentStep === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glassmorphism border-white/10 shadow-xl">
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold mb-2">Point de livraison</h2>
                      <p className="text-sm text-muted-foreground">Où livrer le colis ?</p>
                    </div>

                    {/* Résumé pickup */}
                    {pickup && (
                      <div className="glassmorphism-light p-3 rounded-lg mb-4 border border-congo-green/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-congo-green" />
                          <span className="text-sm font-medium">De: {pickup.name}</span>
                        </div>
                      </div>
                    )}

                    {/* Même interface que pickup */}
                    <Button
                      variant="outline"
                      className="w-full h-12 mb-6 glassmorphism-light border-congo-blue/30 hover:bg-congo-blue/10 transition-all duration-300"
                      onClick={handleCurrentLocation}
                      disabled={isLocating}
                    >
                      {isLocating ? (
                        <div className="w-4 h-4 mr-3 border-2 border-congo-blue border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4 mr-3 text-congo-blue" />
                      )}
                      <span>Ma position actuelle</span>
                    </Button>

                    <div className="mb-4">
                      <Input
                        placeholder="Rechercher un lieu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glassmorphism-light border-white/20"
                      />
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Lieux populaires</h3>
                      {filteredPlaces.map((place) => (
                        <motion.div
                          key={place.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="ghost"
                            className="w-full h-auto p-3 justify-start glassmorphism-light border border-white/10 hover:border-congo-blue/30 transition-all"
                            onClick={() => handleLocationSelect(place)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <MapPin className="w-4 h-4 text-congo-red mt-1 flex-shrink-0" />
                              <div className="text-left flex-1">
                                <div className="font-medium text-sm mb-1">{place.name}</div>
                                <p className="text-xs text-muted-foreground">{place.address}</p>
                                <span className="inline-block text-xs bg-congo-red/20 text-congo-red px-2 py-0.5 rounded-full mt-1">
                                  {place.category}
                                </span>
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setCurrentStep('pickup')}
                    >
                      Retour
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Étape 3: Service */}
            {currentStep === 'service' && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glassmorphism border-white/10 shadow-xl">
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold mb-2">Type de livraison</h2>
                      <p className="text-sm text-muted-foreground">Choisissez votre service</p>
                    </div>

                    {/* Résumé des adresses */}
                    <div className="glassmorphism-light p-4 rounded-lg mb-6 space-y-2">
                      {pickup && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-congo-green" />
                          <span>De: {pickup.name}</span>
                        </div>
                      )}
                      {delivery && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-congo-red" />
                          <span>Vers: {delivery.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Services de livraison */}
                    <div className="space-y-3">
                      {DELIVERY_SERVICES.map((service) => {
                        const IconComponent = service.icon;
                        return (
                          <motion.div
                            key={service.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant={deliveryType === service.id ? "default" : "outline"}
                              className={cn(
                                "w-full h-auto p-4 justify-start transition-all duration-300",
                                deliveryType === service.id 
                                  ? "bg-congo-blue/20 border-congo-blue/50 text-foreground" 
                                  : "glassmorphism-light border-white/20 hover:border-white/40"
                              )}
                              onClick={() => handleServiceSelect(service.id as any)}
                            >
                              <div className="flex items-center gap-4 w-full">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  service.id === 'flash' && "bg-congo-red/20",
                                  service.id === 'flex' && "bg-congo-blue/20",
                                  service.id === 'maxicharge' && "bg-congo-green/20"
                                )}>
                                  <IconComponent className={cn(
                                    "w-5 h-5",
                                    service.id === 'flash' && "text-congo-red",
                                    service.id === 'flex' && "text-congo-blue",
                                    service.id === 'maxicharge' && "text-congo-green"
                                  )} />
                                </div>
                                <div className="text-left flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{service.name}</span>
                                    <span className="text-sm font-bold">{service.price.toLocaleString()} CDF</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{service.desc}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{service.time}</span>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>

                    <Button
                      className="w-full mt-6"
                      onClick={() => setCurrentStep('confirm')}
                    >
                      Continuer
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => setCurrentStep('delivery')}
                    >
                      Retour
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Étape 4: Confirmation */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glassmorphism border-white/10 shadow-xl">
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-congo-green/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-congo-green" />
                      </div>
                      <h2 className="text-xl font-bold mb-2">Confirmer la commande</h2>
                      <p className="text-sm text-muted-foreground">Vérifiez les détails</p>
                    </div>

                    {/* Résumé complet */}
                    <div className="space-y-4 mb-6">
                      <div className="glassmorphism-light p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Adresses</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-congo-green" />
                            <span>De: {pickup?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-congo-red" />
                            <span>Vers: {delivery?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="glassmorphism-light p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Service sélectionné</h3>
                        <div className="flex items-center gap-3">
                          {selectedService && (
                            <>
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                selectedService.id === 'flash' && "bg-congo-red/20",
                                selectedService.id === 'flex' && "bg-congo-blue/20",
                                selectedService.id === 'maxicharge' && "bg-congo-green/20"
                              )}>
                                <selectedService.icon className={cn(
                                  "w-4 h-4",
                                  selectedService.id === 'flash' && "text-congo-red",
                                  selectedService.id === 'flex' && "text-congo-blue",
                                  selectedService.id === 'maxicharge' && "text-congo-green"
                                )} />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{selectedService.name}</div>
                                <div className="text-sm text-muted-foreground">{selectedService.desc}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{selectedService.price.toLocaleString()} CDF</div>
                                <div className="text-xs text-muted-foreground">{selectedService.time}</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        className="w-full h-12 bg-gradient-to-r from-congo-blue to-congo-red hover:shadow-lg"
                        onClick={handleSubmit}
                      >
                        Confirmer la commande
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>

                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => setCurrentStep('service')}
                    >
                      Modifier
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full mt-2 text-muted-foreground"
                      onClick={onCancel}
                    >
                      Annuler
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}