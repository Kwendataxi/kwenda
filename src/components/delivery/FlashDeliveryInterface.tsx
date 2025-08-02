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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bike className="w-6 h-6" />
            <div>
              <h1 className="font-semibold text-lg">Flash Delivery</h1>
              <p className="text-orange-100 text-sm">Petits colis • Livraison rapide</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-orange-100 text-xs">Prix estimé</p>
            <p className="font-bold text-lg">{calculatePrice().toLocaleString()} FC</p>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="px-4 py-3">
        <InteractiveMap
          pickup={pickup}
          destination={destination}
          showRoute={!!(pickup && destination)}
          className="h-48 rounded-2xl"
          onLocationSelect={(location) => {
            if (!pickup) {
              setPickup(location);
            } else if (!destination) {
              setDestination(location);
            }
          }}
        />
      </div>

      {/* Address Inputs */}
      <div className="px-4 space-y-3">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          </div>
          <Input
            placeholder="Prise en charge"
            value={pickup?.address || ''}
            onChange={(e) => setPickup(e.target.value ? { address: e.target.value, coordinates: [-15.3094, 4.3276] } : null)}
            className="pl-10 h-12 rounded-xl border-grey-200"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-orange-500 text-xs"
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
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <MapPin className="w-4 h-4 text-red-500" />
          </div>
          <Input
            placeholder="Adresse de livraison"
            value={destination?.address || ''}
            onChange={(e) => setDestination(e.target.value ? { address: e.target.value, coordinates: [-15.2094, 4.4276] } : null)}
            className="pl-10 h-12 rounded-xl border-grey-200"
          />
        </div>
      </div>

      {/* Vehicle Info Card */}
      <div className="px-4 py-4">
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-grey-900">Moto Flash</h3>
              <p className="text-sm text-grey-600">Documents, téléphones, petits colis</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-grey-600">
                  <Clock className="w-4 h-4" />
                  <span>15-25 min</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-grey-600">
                  <Shield className="w-4 h-4" />
                  <span>Assuré</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-orange-600">
                {calculatePrice().toLocaleString()} FC
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA Button */}
      <div className="p-4 bg-white border-t border-grey-100">
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg rounded-xl shadow-lg mb-2"
        >
          Confirmer la livraison Flash
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full text-grey-600"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default FlashDeliveryInterface;