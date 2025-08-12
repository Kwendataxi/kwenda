import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  MessageCircle, 
  Car,
  Navigation2,
  Zap,
  Search,
  Timer,
  ChevronRight,
  AlertCircle,
  Wallet,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useDriverCredits } from '@/hooks/useDriverCredits';

interface MarketplaceDriverProfile {
  user_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating_average: number;
  rating_count: number;
  display_name: string;
  phone_number: string;
}

interface MarketplaceDriver {
  driver_id: string;
  distance: number;
  estimated_arrival: number;
  driver_profile: MarketplaceDriverProfile;
  has_sufficient_balance: boolean;
}

interface MarketplaceDriverSearchProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  pickupLocation: string;
  deliveryLocation: string;
  onAssignmentComplete: (assignmentId: string) => void;
}

const ASSIGNMENT_FEE = 500; // Frais d'assignation en CDF

export const MarketplaceDriverSearch: React.FC<MarketplaceDriverSearchProps> = ({
  isOpen,
  onClose,
  orderId,
  pickupLocation,
  deliveryLocation,
  onAssignmentComplete
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [drivers, setDrivers] = useState<MarketplaceDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<MarketplaceDriver | null>(null);
  const [searchDuration, setSearchDuration] = useState(0);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { credits, hasBalance, deductCredits, loading: creditsLoading } = useDriverCredits();

  // Search timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSearchDuration(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Auto-select first driver with sufficient balance
  useEffect(() => {
    if (!isSearching && drivers.length > 0 && !selectedDriver) {
      const driverWithBalance = drivers.find(d => d.has_sufficient_balance);
      setSelectedDriver(driverWithBalance || drivers[0]);
    }
  }, [isSearching, drivers, selectedDriver]);

  const findMarketplaceDrivers = async () => {
    setIsSearching(true);
    setDrivers([]);
    setSelectedDriver(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-driver-assignment', {
        body: {
          action: 'find_marketplace_drivers',
          order_id: orderId,
          pickup_location: pickupLocation,
          delivery_location: deliveryLocation
        }
      });

      if (error) throw error;

      // Simulate realistic search time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (data?.success && data?.drivers) {
        setDrivers(data.drivers);
      } else {
        setDrivers([]);
      }
    } catch (error: any) {
      console.error('Error finding marketplace drivers:', error);
      toast.error('Erreur lors de la recherche de livreurs');
      setDrivers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const assignDriver = async (driver: MarketplaceDriver) => {
    if (!hasBalance(ASSIGNMENT_FEE)) {
      toast.error(`Solde insuffisant. Frais d'assignation: ${formatCurrency(ASSIGNMENT_FEE)}`);
      return;
    }

    setIsAssigning(true);
    
    try {
      // Déduire les crédits d'abord
      const deductionSuccess = await deductCredits(
        ASSIGNMENT_FEE,
        'marketplace_assignment',
        orderId,
        `Assignation livreur marketplace - Commande ${orderId.slice(0, 8)}`
      );

      if (!deductionSuccess) {
        throw new Error('Échec de la déduction des crédits');
      }

      // Assigner le livreur
      const { data, error } = await supabase.functions.invoke('marketplace-driver-assignment', {
        body: {
          action: 'assign_marketplace_driver',
          order_id: orderId,
          driver_id: driver.driver_id,
          pickup_location: pickupLocation,
          delivery_location: deliveryLocation,
          assignment_fee: ASSIGNMENT_FEE
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Livreur assigné: ${driver.driver_profile.display_name}`);
        onAssignmentComplete(data.assignment_id || 'assigned');
        onClose();
      } else {
        throw new Error(data?.message || 'Erreur lors de l\'assignation');
      }
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast.error('Erreur lors de l\'assignation du livreur');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDriverSelect = (driver: MarketplaceDriver) => {
    setSelectedDriver(driver);
  };

  const handleConfirmDriver = () => {
    if (selectedDriver) {
      assignDriver(selectedDriver);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      findMarketplaceDrivers();
    } else {
      setIsSearching(false);
      setDrivers([]);
      setSelectedDriver(null);
      setSearchDuration(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recherche de livreur Kwenda</DialogTitle>
        </DialogHeader>

        {/* Balance indicator */}
        <div className="bg-muted/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Solde disponible:</span>
            </div>
            <span className="font-bold text-primary">
              {creditsLoading ? '...' : formatCurrency(credits?.balance || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Frais d'assignation:</span>
            <span>{formatCurrency(ASSIGNMENT_FEE)}</span>
          </div>
          {credits && !hasBalance(ASSIGNMENT_FEE) && (
            <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>Solde insuffisant pour l'assignation</span>
            </div>
          )}
        </div>

        {/* Search state */}
        {isSearching && (
          <div className="text-center space-y-6 py-8">
            {/* Radar Animation */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [1, 0.5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-secondary"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [1, 0.5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5,
                  ease: "easeOut"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">Recherche de livreurs...</h3>
              <p className="text-sm text-muted-foreground">
                Recherche des livreurs disponibles dans votre zone
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>{searchDuration}s</span>
              </div>
            </div>
          </div>
        )}

        {/* No drivers found */}
        {!isSearching && drivers.length === 0 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Aucun livreur disponible</h3>
              <p className="text-sm text-muted-foreground">
                Aucun livreur n'est disponible pour cette zone en ce moment
              </p>
            </div>

            <Button onClick={findMarketplaceDrivers} className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Rechercher à nouveau
            </Button>
          </div>
        )}

        {/* Drivers found */}
        {!isSearching && drivers.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h3 className="text-lg font-bold">Livreurs trouvés</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {drivers.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Sélectionnez votre livreur préféré
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
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
                        className={`cursor-pointer transition-all duration-300 relative ${
                          isSelected 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:shadow-md'
                        } ${!driver.has_sufficient_balance ? 'opacity-60' : ''}`}
                        onClick={() => handleDriverSelect(driver)}
                      >
                        {isClosest && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-secondary text-secondary-foreground text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Plus proche
                            </Badge>
                          </div>
                        )}
                        
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            {/* Driver Avatar */}
                            <div className="relative">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Car className="w-6 h-6 text-primary" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                            </div>
                            
                            {/* Driver Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {driver.driver_profile.display_name}
                                </h4>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {driver.estimated_arrival} min
                                </div>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mb-1">
                                {driver.driver_profile.vehicle_make} {driver.driver_profile.vehicle_model}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span className="text-xs ml-1">
                                      {driver.driver_profile.rating_average.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {driver.distance.toFixed(1)} km
                                  </div>
                                </div>
                                
                                {!driver.has_sufficient_balance && (
                                  <Badge variant="destructive" className="text-xs">
                                    Solde insuffisant
                                  </Badge>
                                )}
                                
                                {isSelected && (
                                  <ChevronRight className="w-4 h-4 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Confirm button */}
            {selectedDriver && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Livreur sélectionné:</span>
                  <span className="font-medium">{selectedDriver.driver_profile.display_name}</span>
                </div>
                
                <Button 
                  onClick={handleConfirmDriver}
                  disabled={isAssigning || !selectedDriver.has_sufficient_balance || !hasBalance(ASSIGNMENT_FEE)}
                  className="w-full"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Assignation...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirmer - {formatCurrency(ASSIGNMENT_FEE)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};