import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import InteractiveMap from '@/components/transport/InteractiveMap';
import { 
  MapPin, 
  Package, 
  Clock, 
  Bike,
  Target,
  Shield
} from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface FlashDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const FlashDeliveryInterface = ({ onSubmit, onCancel }: FlashDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);

  const basePrice = 500;
  
  const calculatePrice = () => {
    const distance = pickup && destination ? 2.5 : 0; // Mock distance
    return Math.round(basePrice + (distance * 100));
  };

  const handleSubmit = () => {
    if (!pickup || !destination) return;
    
    onSubmit({
      mode: 'flash',
      pickup,
      destination,
      vehicle: 'moto',
      price: calculatePrice(),
      estimatedTime: '15-25 min'
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header Flash-style */}
      <div className="bg-gradient-to-r from-secondary to-secondary-light px-6 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-heading-md text-white">Flash Delivery</h1>
              <p className="text-white/80 text-body-sm">Petits colis • Livraison rapide</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-caption uppercase tracking-wider">Prix estimé</p>
            <p className="text-heading-lg text-white font-bold">{calculatePrice().toLocaleString()} FC</p>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="px-6 py-4">
        <div className="relative">
          <InteractiveMap
            pickup={pickup}
            destination={destination}
            showRoute={!!(pickup && destination)}
            className="h-56 rounded-2xl border border-border/50 shadow-md"
            onLocationSelect={(location) => {
              if (!pickup) {
                setPickup(location);
              } else if (!destination) {
                setDestination(location);
              }
            }}
          />
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm flex items-center justify-center text-grey-600 hover:bg-white transition-all">
              <span className="text-lg font-semibold">+</span>
            </button>
            <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm flex items-center justify-center text-grey-600 hover:bg-white transition-all">
              <span className="text-lg font-semibold">−</span>
            </button>
            <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm flex items-center justify-center text-grey-600 hover:bg-white transition-all">
              <Target className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Address Inputs */}
      <div className="px-6 space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="w-4 h-4 bg-secondary rounded-full shadow-sm"></div>
          </div>
          <Input
            placeholder="Adresse de prise en charge"
            value={pickup?.address || ''}
            onChange={(e) => setPickup(e.target.value ? { address: e.target.value, coordinates: [-15.3094, 4.3276] } : null)}
            className="pl-12 pr-32 h-14 rounded-xl border-2 border-border focus:border-secondary text-body-md bg-white shadow-sm transition-all"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary hover:text-secondary-light text-caption font-medium px-2 py-1 h-8"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  setPickup({
                    address: "Ma position actuelle",
                    coordinates: [position.coords.longitude, position.coords.latitude]
                  });
                });
              }
            }}
          >
            <Target className="w-4 h-4 mr-1" />
            Ma position
          </Button>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <Input
            placeholder="Adresse de livraison"
            value={destination?.address || ''}
            onChange={(e) => setDestination(e.target.value ? { address: e.target.value, coordinates: [-15.2094, 4.4276] } : null)}
            className="pl-12 h-14 rounded-xl border-2 border-border focus:border-primary text-body-md bg-white shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Vehicle Info Card */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-md">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary-light text-white flex items-center justify-center shadow-sm">
              <Bike className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-heading-sm text-foreground">Moto Flash</h3>
              <p className="text-body-sm text-muted-foreground mt-1">Documents, téléphones, petits colis</p>
              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span>15-25 min</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-secondary" />
                  <span>Assuré</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-heading-lg font-bold text-secondary">
                {calculatePrice().toLocaleString()} FC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA Button */}
      <div className="p-6 bg-white border-t border-border/50">
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination}
          className="w-full h-16 bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white font-semibold text-body-lg rounded-2xl shadow-lg mb-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: 'var(--shadow-elegant)' }}
        >
          Confirmer la livraison Flash
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full text-muted-foreground hover:text-foreground text-body-md"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default FlashDeliveryInterface;