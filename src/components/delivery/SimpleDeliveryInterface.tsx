import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Package, ArrowRight, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Lieux populaires locaux sans API
const POPULAR_PLACES: Location[] = [
  {
    id: '1',
    name: 'Université de Kinshasa',
    address: 'Campus, Lemba',
    category: 'Education',
    coordinates: { lat: -4.3726, lng: 15.3678 }
  },
  {
    id: '2', 
    name: 'Marché Central de Kinshasa',
    address: 'Avenue Tombalbaye, Centre-ville, Gombe',
    category: 'Commerce',
    coordinates: { lat: -4.3150, lng: 15.3100 }
  },
  {
    id: '3',
    name: 'Aéroport International N\'djili',
    address: 'N\'djili, Nsele',
    category: 'Transport',
    coordinates: { lat: -4.3857, lng: 15.4446 }
  },
  {
    id: '4',
    name: 'Gombe Centre',
    address: 'Boulevard du 30 Juin, Gombe',
    category: 'Centre-ville',
    coordinates: { lat: -4.3217, lng: 15.3069 }
  },
  {
    id: '5',
    name: 'Hôtel Memling',
    address: 'Avenue des Aviateurs, Gombe',
    category: 'Hôtel',
    coordinates: { lat: -4.3200, lng: 15.3050 }
  },
  {
    id: '6',
    name: 'Stade des Martyrs',
    address: 'Commune de Kalamu',
    category: 'Sport',
    coordinates: { lat: -4.3500, lng: 15.3200 }
  }
];

interface SimpleDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function SimpleDeliveryInterface({ onSubmit, onCancel }: SimpleDeliveryInterfaceProps) {
  const [step, setStep] = useState<'pickup' | 'delivery' | 'type'>('pickup');
  const [pickup, setPickup] = useState<Location | null>(null);
  const [delivery, setDelivery] = useState<Location | null>(null);
  const [deliveryType, setDeliveryType] = useState<'flash' | 'flex' | 'maxicharge'>('flex');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const handleLocationSelect = (location: Location) => {
    if (step === 'pickup') {
      setPickup(location);
      setStep('delivery');
    } else if (step === 'delivery') {
      setDelivery(location);
      setStep('type');
    }
  };

  const handleCurrentLocation = () => {
    const currentLoc: Location = {
      id: 'current',
      name: 'Ma position actuelle',
      address: 'Position GPS actuelle',
      category: 'Actuelle',
      coordinates: { lat: -4.3217, lng: 15.3069 }
    };
    
    setUseCurrentLocation(true);
    handleLocationSelect(currentLoc);
  };

  const handleSubmit = () => {
    if (!pickup || !delivery) return;
    
    const orderData = {
      pickup_location: pickup.address,
      pickup_coordinates: pickup.coordinates,
      delivery_location: delivery.address,
      delivery_coordinates: delivery.coordinates,
      delivery_type: deliveryType,
      estimated_price: calculatePrice(),
      status: 'pending'
    };
    
    onSubmit(orderData);
  };

  const calculatePrice = () => {
    const basePrices = { flash: 5000, flex: 3000, maxicharge: 8000 };
    return basePrices[deliveryType];
  };

  const getStepTitle = () => {
    switch (step) {
      case 'pickup': return 'Point de collecte';
      case 'delivery': return 'Point de livraison';
      case 'type': return 'Type de livraison';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'pickup': return 'Où récupérer le colis ?';
      case 'delivery': return 'Où livrer le colis ?';
      case 'type': return 'Choisissez votre service';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-2 h-2 rounded-full animate-pulse",
              i % 4 === 0 && "bg-red-400/30",
              i % 4 === 1 && "bg-yellow-400/30", 
              i % 4 === 2 && "bg-green-400/30",
              i % 4 === 3 && "bg-blue-400/30"
            )}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Adresses</h1>
          <p className="text-muted-foreground">
            Définissez les points de collecte et de livraison
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {['pickup', 'delivery', 'type'].map((s, i) => (
              <div
                key={s}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  step === s ? "bg-primary text-primary-foreground" : 
                  i < ['pickup', 'delivery', 'type'].indexOf(step) ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <Card className="mx-auto max-w-md bg-card/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="p-6">
            {/* Step Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">{getStepTitle()}</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-8">{getStepSubtitle()}</p>
            </div>

            {step !== 'type' && (
              <>
                {/* Current Location Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start mb-6 h-12 bg-background/50"
                  onClick={handleCurrentLocation}
                >
                  <Navigation className="w-4 h-4 mr-3" />
                  <span>Utiliser ma position actuelle</span>
                </Button>

                {/* Popular Places */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Lieux populaires à Kinshasa
                  </h3>
                  
                  {POPULAR_PLACES.map((place) => (
                    <Button
                      key={place.id}
                      variant="ghost"
                      className="w-full h-auto p-4 justify-start bg-background/30 hover:bg-background/60 transition-all"
                      onClick={() => handleLocationSelect(place)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                        <div className="text-left flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{place.name}</span>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Populaire
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {place.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {place.category}
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </>
            )}

            {step === 'type' && (
              <div className="space-y-4">
                {[
                  { id: 'flash', name: 'Flash', desc: 'Livraison express en 30min', price: '5 000 CDF' },
                  { id: 'flex', name: 'Flex', desc: 'Livraison standard en 2h', price: '3 000 CDF' },
                  { id: 'maxicharge', name: 'Maxicharge', desc: 'Gros colis, livraison en 4h', price: '8 000 CDF' }
                ].map((type) => (
                  <Button
                    key={type.id}
                    variant={deliveryType === type.id ? "default" : "outline"}
                    className="w-full h-auto p-4 justify-start"
                    onClick={() => setDeliveryType(type.id as any)}
                  >
                    <div className="text-left w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{type.name}</span>
                        <span className="text-sm font-bold">{type.price}</span>
                      </div>
                      <p className="text-xs opacity-70 mt-1">{type.desc}</p>
                    </div>
                  </Button>
                ))}

                <div className="pt-4 space-y-3">
                  <Button onClick={handleSubmit} className="w-full">
                    Confirmer la commande
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={onCancel} className="w-full">
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Back Button */}
            {step !== 'pickup' && step !== 'type' && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setStep(step === 'delivery' ? 'pickup' : 'pickup')}
              >
                Retour
              </Button>
            )}
          </div>
        </Card>

        {/* Summary */}
        {(pickup || delivery) && step !== 'type' && (
          <Card className="mx-auto max-w-md mt-4 bg-card/60 backdrop-blur-sm border-0">
            <div className="p-4">
              <h3 className="text-sm font-medium mb-3">Résumé</h3>
              {pickup && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>De: {pickup.name}</span>
                </div>
              )}
              {delivery && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>Vers: {delivery.name}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}