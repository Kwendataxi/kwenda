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
  Truck,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import EnhancedDriverFilters from './EnhancedDriverFilters';
import DeliveryDriverChatModal from './DeliveryDriverChatModal';

interface DeliveryDriverProfile {
  user_id: string;
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating_average: number;
  rating_count: number;
  total_rides?: number;
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
  const [filteredDrivers, setFilteredDrivers] = useState<DeliveryDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
  const [searchDuration, setSearchDuration] = useState(0);
  const [searchRadius, setSearchRadius] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [filters, setFilters] = useState({
    vehicleTypes: [] as string[],
    minRating: 0,
    maxDistance: 20,
    maxPrice: 50000,
    onlyVerified: false
  });

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

  // Auto-sélection du livreur le plus proche et application des filtres
  useEffect(() => {
    if (searchState === 'found' && drivers.length > 0) {
      // Appliquer les filtres
      const filtered = drivers.filter(driver => {
        // Filtre par type de véhicule
        if (filters.vehicleTypes.length > 0 && !filters.vehicleTypes.includes(driver.vehicle_type)) {
          return false;
        }
        
        // Filtre par rating
        if (driver.driver_profile.rating_average < filters.minRating) {
          return false;
        }
        
        // Filtre par distance
        if (driver.distance > filters.maxDistance) {
          return false;
        }
        
        return true;
      });
      
      setFilteredDrivers(filtered);
      
      // Auto-sélection du premier livreur filtré
      if (filtered.length > 0 && !selectedDriver) {
        setSelectedDriver(filtered[0]);
      }
    }
  }, [searchState, drivers, selectedDriver, filters]);

  const findDeliveryDrivers = async (manualSearch = false) => {
    try {
      setSearchState('searching');
      
      if (manualSearch) {
        toast.info('Recherche manuelle en cours...');
      }
      
      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          action: 'find_drivers',
          orderId: orderId,
          mode: deliveryMode,
          radiusKm: searchRadius,
          maxDrivers: 10
        }
      });

      if (error) {
        console.error('Erreur recherche livreurs:', error);
        toast.error('Erreur lors de la recherche de livreurs');
        setSearchState('none');
        return;
      }

      // Utiliser les vraies données ou fallback sur mock
      const realDrivers = data?.drivers || [];
      
      if (realDrivers.length > 0) {
        console.log(`Trouvé ${realDrivers.length} livreurs réels`);
        setDrivers(realDrivers);
        setSearchState('found');
        toast.success(`${realDrivers.length} livreur${realDrivers.length > 1 ? 's' : ''} trouvé${realDrivers.length > 1 ? 's' : ''}`);
      } else {
        // Fallback avec données simulées pour la démo
        console.log('Aucun livreur réel, utilisation de données simulées');
        
        setTimeout(() => {
          const mockDrivers: DeliveryDriver[] = [
            {
              driver_id: 'demo_driver_1',
              distance: 0.8,
              estimated_arrival: 5,
              vehicle_type: deliveryMode === 'flash' ? 'moto' : deliveryMode === 'maxicharge' ? 'truck' : 'car',
              driver_profile: {
                user_id: 'demo_user_1',
                vehicle_type: deliveryMode === 'flash' ? 'Moto Honda' : deliveryMode === 'maxicharge' ? 'Camion Isuzu' : 'Toyota Corolla',
                vehicle_plate: 'KIN-1234',
                vehicle_color: 'Bleu',
                rating_average: 4.8,
                rating_count: 152,
                total_rides: 320,
                display_name: 'Jean-Paul K.',
                phone_number: '+243900000001'
              }
            },
            {
              driver_id: 'demo_driver_2',
              distance: 1.2,
              estimated_arrival: 8,
              vehicle_type: deliveryMode === 'flash' ? 'moto' : deliveryMode === 'maxicharge' ? 'truck' : 'car',
              driver_profile: {
                user_id: 'demo_user_2',
                vehicle_type: deliveryMode === 'flash' ? 'Moto Yamaha' : deliveryMode === 'maxicharge' ? 'Camion Toyota' : 'Nissan Almera',
                vehicle_plate: 'KIN-5678',
                vehicle_color: 'Rouge',
                rating_average: 4.6,
                rating_count: 89,
                total_rides: 156,
                display_name: 'Marie T.',
                phone_number: '+243900000002'
              }
            }
          ];

          setDrivers(mockDrivers);
          setSearchState('found');
          toast.success(`${mockDrivers.length} livreurs trouvés (démo)`);
        }, 2500);
      }

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
      // Utiliser la fonction d'assignation de l'edge function
      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          action: 'assign_driver',
          orderId: orderId,
          driverId: selectedDriver.driver_id
        }
      });

      if (error || !data?.success) {
        console.error('Erreur assignation livreur:', error);
        toast.error(data?.error || 'Erreur lors de l\'assignation du livreur');
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
    findDeliveryDrivers(true);
  };

  const handleManualSearch = () => {
    findDeliveryDrivers(true);
  };

  const handleApplyFilters = () => {
    // Les filtres sont appliqués automatiquement via useEffect
    toast.success('Filtres appliqués');
  };

  const handleContactDriver = () => {
    if (selectedDriver) {
      setShowChat(true);
    }
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

                <div className="space-y-2">
                  <Button 
                    onClick={handleManualSearch}
                    variant="outline"
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher manuellement
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={onCancel}
                    className="w-full text-muted-foreground"
                  >
                    Annuler
                  </Button>
                </div>
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
                    Élargir la recherche ({searchRadius + 5} km)
                  </Button>
                  
                  <Button 
                    onClick={handleManualSearch}
                    variant="outline"
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher à nouveau
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={onBackToForm}
                    className="w-full text-muted-foreground"
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
            <p className="text-sm opacity-90">
              {filteredDrivers.length} sur {drivers.length} livreur{drivers.length > 1 ? 's' : ''}
            </p>
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
        
        {/* Barre d'actions */}
        <div className="px-4 py-2 bg-background/80 backdrop-blur border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="flex-1"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
              {(filters.vehicleTypes.length > 0 || filters.minRating > 0 || filters.onlyVerified) && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {[
                    filters.vehicleTypes.length > 0,
                    filters.minRating > 0,
                    filters.onlyVerified
                  ].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-24">
        {/* Message si filtres actifs */}
        {filteredDrivers.length < drivers.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              {drivers.length - filteredDrivers.length} livreur{drivers.length - filteredDrivers.length > 1 ? 's' : ''} masqué{drivers.length - filteredDrivers.length > 1 ? 's' : ''} par les filtres
            </p>
          </div>
        )}

        {/* Liste des livreurs */}
        <AnimatePresence>
          {filteredDrivers.map((driver, index) => {
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
                            
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Package className="w-3 h-3 mr-1" />
                              {driver.driver_profile.total_rides || 0} courses
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