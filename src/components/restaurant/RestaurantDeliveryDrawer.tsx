/**
 * Drawer Kwenda Delivery pour restaurants
 * Permet de commander un livreur avec données pré-remplies
 */

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDynamicDeliveryPricing } from '@/hooks/useDynamicDeliveryPricing';
import { 
  Package, MapPin, Truck, CheckCircle2, Loader2, X, Utensils
} from 'lucide-react';
import { motion } from 'framer-motion';

interface RestaurantDeliveryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number?: string;
    delivery_address?: string;
    delivery_coordinates?: { lat: number; lng: number };
    delivery_phone?: string;
    customer_name?: string;
  };
  restaurantProfile?: {
    restaurant_name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone_number?: string;
  };
  onDeliveryRequested: (deliveryFee: number, serviceType: string) => void;
}

type ServiceType = 'flash' | 'flex' | 'maxicharge';

const SERVICES = {
  flash: {
    name: 'Flash',
    emoji: '⚡',
    description: 'Express 30-45 min',
    gradient: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-500',
    bgHover: 'hover:bg-red-500/5'
  },
  flex: {
    name: 'Flex',
    emoji: '📦',
    description: 'Standard 1-2h',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-500',
    bgHover: 'hover:bg-blue-500/5'
  },
  maxicharge: {
    name: 'MaxiCharge',
    emoji: '🚚',
    description: 'Gros volumes',
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-500',
    bgHover: 'hover:bg-purple-500/5'
  }
};

export const RestaurantDeliveryDrawer = ({
  isOpen,
  onClose,
  order,
  restaurantProfile,
  onDeliveryRequested
}: RestaurantDeliveryDrawerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { calculatePrice, formatPrice } = useDynamicDeliveryPricing();
  
  const [selectedService, setSelectedService] = useState<ServiceType>('flash');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [distance, setDistance] = useState<number>(0);

  // Calculer la distance entre deux points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculer le prix quand le service change
  useEffect(() => {
    const fetchPrice = async () => {
      if (!order?.delivery_coordinates || !restaurantProfile?.latitude || !restaurantProfile?.longitude) {
        // Utiliser une distance par défaut si pas de coordonnées
        const defaultDistance = 5;
        setDistance(defaultDistance);
        const result = await calculatePrice(selectedService, defaultDistance);
        if (result) {
          setCalculatedPrice(result.calculated_price);
        }
        return;
      }
      
      setIsCalculating(true);
      const dist = calculateDistance(
        restaurantProfile.latitude,
        restaurantProfile.longitude,
        order.delivery_coordinates.lat,
        order.delivery_coordinates.lng
      );
      setDistance(dist);
      
      const result = await calculatePrice(selectedService, dist);
      if (result) {
        setCalculatedPrice(result.calculated_price);
      }
      setIsCalculating(false);
    };
    
    if (isOpen) {
      fetchPrice();
    }
  }, [selectedService, order?.delivery_coordinates, restaurantProfile, isOpen]);

  // Commander un livreur
  const handleRequestDelivery = async () => {
    if (!user || !order || calculatedPrice <= 0) return;
    
    setIsCreatingOrder(true);
    
    try {
      toast({
        title: "✅ Livreur commandé",
        description: `Service ${SERVICES[selectedService].name} - ${formatPrice(calculatedPrice)}`
      });

      onDeliveryRequested(calculatedPrice, selectedService);
      onClose();
      
    } catch (error: any) {
      console.error('Erreur commande livreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de commander le livreur",
        variant: "destructive"
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const pickupAddress = restaurantProfile?.address || restaurantProfile?.restaurant_name || 'Votre restaurant';
  const deliveryAddress = order?.delivery_address || 'Adresse client';

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <Truck className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <DrawerTitle className="text-lg">Kwenda Delivery</DrawerTitle>
                <p className="text-xs text-muted-foreground">
                  Commande #{order?.order_number || order?.id?.slice(0, 8)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Trajet */}
          <Card className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-border/40">
            <div className="space-y-3">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Utensils className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Restaurant</p>
                  <p className="text-sm font-medium truncate">{pickupAddress}</p>
                </div>
              </div>

              {/* Ligne de connexion */}
              <div className="ml-4 border-l-2 border-dashed border-border/60 h-4" />

              {/* Delivery */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Livraison</p>
                  <p className="text-sm font-medium truncate">{deliveryAddress}</p>
                </div>
              </div>

              {/* Distance */}
              {distance > 0 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Badge variant="secondary" className="text-xs">
                    📏 {distance.toFixed(1)} km
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Sélection du service */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Type de livraison</Label>
            <div className="grid gap-2">
              {(Object.keys(SERVICES) as ServiceType[]).map((serviceKey) => {
                const service = SERVICES[serviceKey];
                const isSelected = selectedService === serviceKey;
                
                return (
                  <motion.div
                    key={serviceKey}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(serviceKey)}
                  >
                    <Card 
                      className={`p-3 cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? `bg-gradient-to-r ${service.gradient} border-2 ${service.borderColor} shadow-md` 
                          : `bg-white/40 dark:bg-slate-900/40 border-border/40 ${service.bgHover}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{service.emoji}</span>
                          <div>
                            <p className={`font-semibold text-sm ${isSelected ? service.textColor : ''}`}>
                              {service.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{service.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className={`h-5 w-5 ${service.textColor}`} />
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Prix calculé */}
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frais de livraison</p>
                <div className="flex items-center gap-2">
                  {isCalculating ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(calculatedPrice)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge className={`${SERVICES[selectedService].textColor} bg-transparent border ${SERVICES[selectedService].borderColor}`}>
                  {SERVICES[selectedService].emoji} {SERVICES[selectedService].name}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Bouton de confirmation */}
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleRequestDelivery}
            disabled={isCreatingOrder || calculatedPrice <= 0 || isCalculating}
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Commander • {formatPrice(calculatedPrice)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Un livreur Kwenda sera automatiquement assigné
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
