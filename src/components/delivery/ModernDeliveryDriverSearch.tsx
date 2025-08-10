/**
 * Composant de recherche de livreur moderne adapté pour la livraison
 * Basé sur ModernDriverSearch mais optimisé pour le service de livraison
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  MessageCircle, 
  Package,
  Navigation2,
  Zap,
  Search,
  Timer,
  ChevronRight,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryDriverProfile {
  user_id: string;
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating_average: number;
  rating_count: number;
  display_name?: string;
  phone_number?: string;
}

interface DeliveryDriver {
  driver_id: string;
  distance: number;
  estimated_arrival: number;
  driver_profile: DeliveryDriverProfile;
  vehicle_type: 'moto' | 'car' | 'truck';
}

interface ModernDeliveryDriverSearchProps {
  orderId: string;
  deliveryMode: 'flash' | 'flex' | 'maxicharge';
  estimatedPrice: number;
  onDriverAssigned: (driverId: string, driverData: DeliveryDriver) => void;
  onCancel: () => void;
  onBackToForm: () => void;
}

const getVehicleIcon = (type: string) => {
  switch (type) {
    case 'moto': return '🏍️';
    case 'car': return '🚗';
    case 'truck': return '🚛';
    default: return '🚗';
  }
};

const getDeliveryModeLabel = (mode: string) => {
  switch (mode) {
    case 'flash': return 'Flash ⚡';
    case 'flex': return 'Flex 🚗';
    case 'maxicharge': return 'MaxiCharge 🚛';
    default: return 'Livraison';
  }
};

export const ModernDeliveryDriverSearch: React.FC<ModernDeliveryDriverSearchProps> = ({
  orderId,
  deliveryMode,
  estimatedPrice,
  onDriverAssigned,
  onCancel,
  onBackToForm
}) => {
  const [searchState, setSearchState] = useState<'searching' | 'found' | 'none'>('searching');
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
  const [searchDuration, setSearchDuration] = useState(0);
  const [searchRadius, setSearchRadius] = useState(5);

  // Recherche initiale de livreurs
  useEffect(() => {
    if (orderId) {
      findDeliveryDrivers();
    }
  }, [orderId]);

  // Timer de recherche
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (searchState === 'searching') {
      interval = setInterval(() => {
        setSearchDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSearchDuration(0);
    }
    return () => clearInterval(interval);
  }, [searchState]);

  // Auto-sélection du livreur le plus proche
  useEffect(() => {
    if (searchState === 'found' && drivers.length > 0 && !selectedDriver) {
      setSelectedDriver(drivers[0]);
    }
  }, [searchState, drivers, selectedDriver]);

  const findDeliveryDrivers = async () => {
    try {
      setSearchState('searching');
      
      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          action: 'find_drivers',
          orderId: orderId,
          mode: deliveryMode,
          radiusKm: searchRadius
        }
      });

      if (error) {
        console.error('Erreur recherche livreurs:', error);
        toast.error('Erreur lors de la recherche de livreurs');
        setSearchState('none');
        return;
      }

      // Simuler quelques livreurs pour la démo
      setTimeout(() => {
        const mockDrivers: DeliveryDriver[] = [
          {
            driver_id: 'driver_1',
            distance: 0.8,
            estimated_arrival: 5,
            vehicle_type: deliveryMode === 'flash' ? 'moto' : deliveryMode === 'maxicharge' ? 'truck' : 'car',
            driver_profile: {
              user_id: 'user_1',
              vehicle_type: deliveryMode === 'flash' ? 'Moto Honda' : deliveryMode === 'maxicharge' ? 'Camion Isuzu' : 'Toyota Corolla',
              vehicle_plate: 'KIN-1234',
              vehicle_color: 'Bleu',
              rating_average: 4.8,
              rating_count: 152,
              display_name: 'Jean-Paul K.',
              phone_number: '+243900000001'
            }
          },
          {
            driver_id: 'driver_2',
            distance: 1.2,
            estimated_arrival: 8,
            vehicle_type: deliveryMode === 'flash' ? 'moto' : deliveryMode === 'maxicharge' ? 'truck' : 'car',
            driver_profile: {
              user_id: 'user_2',
              vehicle_type: deliveryMode === 'flash' ? 'Moto Yamaha' : deliveryMode === 'maxicharge' ? 'Camion Toyota' : 'Nissan Almera',
              vehicle_plate: 'KIN-5678',
              vehicle_color: 'Rouge',
              rating_average: 4.6,
              rating_count: 89,
              display_name: 'Marie T.',
              phone_number: '+243900000002'
            }
          }
        ];

        setDrivers(mockDrivers);
        setSearchState(mockDrivers.length > 0 ? 'found' : 'none');
      }, 3000);

    } catch (error) {
      console.error('Erreur invocation delivery-dispatcher:', error);
      toast.error('Erreur de connexion');
      setSearchState('none');
    }
  };

  const handleDriverSelect = (driver: DeliveryDriver) => {
    setSelectedDriver(driver);
  };

  const handleConfirmDriver = async () => {
    if (!selectedDriver) return;

    try {
      // Assigner le livreur à la commande
      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          driver_id: selectedDriver.driver_id,
          status: 'driver_assigned'
        })
        .eq('id', orderId);

      if (error) {
        console.error('Erreur assignation livreur:', error);
        toast.error('Erreur lors de l\'assignation du livreur');
        return;
      }

      toast.success(`Livreur assigné: ${selectedDriver.driver_profile.display_name}`);
      onDriverAssigned(selectedDriver.driver_id, selectedDriver);
      
    } catch (error) {
      console.error('Erreur confirmation livreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleExpandSearch = () => {
    setSearchRadius(prev => prev + 5);
    findDeliveryDrivers();
  };

  // État recherche en cours
  if (searchState === 'searching') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Recherche de livreur</h1>
              <p className="text-sm opacity-90">Mode {getDeliveryModeLabel(deliveryMode)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToForm}
              className="text-primary-foreground hover:bg-white/20"
            >
              ← Retour
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Animation radar de recherche */}
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                   <motion.div
                     className="absolute inset-0 rounded-full border-2 border-primary/60"
                     animate={{
                       scale: [1, 1.8, 2.2],
                       opacity: [0.8, 0.3, 0]
                     }}
                     transition={{
                       duration: 3,
                       repeat: Infinity,
                       ease: "easeOut"
                     }}
                   />
                   <motion.div
                     className="absolute inset-8 rounded-full border-2 border-primary/80"
                     animate={{
                       scale: [1, 1.4, 1.8],
                       opacity: [0.6, 0.2, 0]
                     }}
                     transition={{
                       duration: 3,
                       repeat: Infinity,
                       delay: 1,
                       ease: "easeOut"
                     }}
                   />
                   <motion.div
                     className="absolute inset-12 rounded-full border-2 border-secondary/60"
                     animate={{
                       scale: [1, 1.2, 1.5],
                       opacity: [0.4, 0.1, 0]
                     }}
                     transition={{
                       duration: 3,
                       repeat: Infinity,
                       delay: 2,
                       ease: "easeOut"
                     }}
                   />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Recherche en cours...</h3>
                  <p className="text-muted-foreground text-sm">
                    Nous trouvons le meilleur livreur disponible pour votre colis
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <span>{searchDuration}s</span>
                    <span>•</span>
                    <span>Rayon {searchRadius} km</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Prix total:</span>
                    <span className="font-semibold text-lg text-primary">
                      {formatCurrency(estimatedPrice)}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="w-full"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Aucun livreur trouvé
  if (searchState === 'none') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Recherche de livreur</h1>
              <p className="text-sm opacity-90">Aucun livreur disponible</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToForm}
              className="text-primary-foreground hover:bg-white/20"
            >
              ← Retour
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Aucun livreur disponible</h3>
                  <p className="text-muted-foreground text-sm">
                    Aucun livreur n'est disponible dans votre zone ({searchRadius} km) en ce moment
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleExpandSearch}
                    className="w-full"
                    variant="default"
                  >
                    <Navigation2 className="w-4 h-4 mr-2" />
                    Élargir la recherche
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onBackToForm}
                    className="w-full"
                  >
                    Modifier ma commande
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Livreurs trouvés - affichage des résultats
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Livreurs disponibles</h1>
            <p className="text-sm opacity-90">{drivers.length} livreur{drivers.length > 1 ? 's' : ''} trouvé{drivers.length > 1 ? 's' : ''}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToForm}
            className="text-primary-foreground hover:bg-white/20"
          >
            ← Retour
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-24">
        {/* Liste des livreurs */}
        <AnimatePresence>
          {drivers.map((driver, index) => {
            const isSelected = selectedDriver?.driver_id === driver.driver_id;
            const isClosest = index === 0;
            
            return (
              <motion.div
                key={driver.driver_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
                      : 'hover:shadow-md hover:scale-[1.02]'
                  }`}
                  onClick={() => handleDriverSelect(driver)}
                >
                  {isClosest && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-secondary text-secondary-foreground text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Plus proche
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Avatar livreur */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                          {getVehicleIcon(driver.vehicle_type)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Infos livreur */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {driver.driver_profile.display_name || 'Livreur'}
                          </h4>
                          <div className="text-right">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {driver.estimated_arrival} min
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {driver.driver_profile.vehicle_type} • {driver.driver_profile.vehicle_plate} • {driver.driver_profile.vehicle_color}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-sm ml-1 font-medium">
                                {driver.driver_profile.rating_average.toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({driver.driver_profile.rating_count})
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {driver.distance.toFixed(1)} km
                            </div>
                          </div>
                          
                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions rapides quand sélectionné */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="flex space-x-2">
                          <Button 
                            className="flex-1"
                            onClick={handleConfirmDriver}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Confirmer - {formatCurrency(estimatedPrice)}
                          </Button>
                          {driver.driver_profile.phone_number && (
                            <Button variant="outline" size="icon" asChild>
                              <a href={`tel:${driver.driver_profile.phone_number}`}>
                                <Phone className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="icon">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Bouton annuler */}
      <div className="p-4 border-t bg-background">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="w-full"
        >
          Annuler la commande
        </Button>
      </div>
    </div>
  );
};

export default ModernDeliveryDriverSearch;