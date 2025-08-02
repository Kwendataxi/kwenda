import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import InteractiveMap from '@/components/transport/InteractiveMap';
import { 
  MapPin, 
  Package, 
  Clock, 
  Truck, 
  Bike,
  Car,
  User,
  ChevronDown,
  Shield,
  Target
} from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface VehicleOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: number;
  time: string;
  description: string;
}

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('moto');
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const vehicleOptions: VehicleOption[] = [
    {
      id: 'moto',
      name: 'Moto',
      icon: <Bike className="w-5 h-5" />,
      price: 300,
      time: '15-20 min',
      description: 'Idéal pour documents et petits colis'
    },
    {
      id: 'car',
      name: 'Voiture',
      icon: <Car className="w-5 h-5" />,
      price: 1900,
      time: '20-30 min',
      description: 'Pour colis moyens et volumineux'
    },
    {
      id: 'express',
      name: 'Express',
      icon: <Truck className="w-5 h-5" />,
      price: 4000,
      time: '10-15 min',
      description: 'Livraison prioritaire garantie'
    }
  ];

  const selectedOption = vehicleOptions.find(v => v.id === selectedVehicle);
  const calculatePrice = () => {
    const basePrice = selectedOption?.price || 0;
    const businessMultiplier = isBusinessMode ? 1.2 : 1;
    return Math.round(basePrice * businessMultiplier);
  };

  const handleSubmit = () => {
    if (!pickup || !destination) return;
    
    onSubmit({
      pickup,
      destination,
      vehicle: selectedVehicle,
      price: calculatePrice(),
      business: isBusinessMode
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header Yango-style */}
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            <div>
              <h1 className="font-semibold text-lg">Envoyer un colis</h1>
              <p className="text-orange-100 text-sm">Livraison rapide à Kinshasa</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-orange-100 text-xs">Solde disponible</p>
            <p className="font-bold text-lg">{calculatePrice().toLocaleString()} FC</p>
          </div>
        </div>
      </div>

      {/* Business/Personal Toggle */}
      <div className="px-4 py-3 bg-white border-b border-grey-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-grey-600" />
            <span className="font-medium">Mode {isBusinessMode ? 'Professionnel' : 'Personnel'}</span>
          </div>
          <Switch
            checked={isBusinessMode}
            onCheckedChange={setIsBusinessMode}
            className="data-[state=checked]:bg-[#FF6B35]"
          />
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
            <div className="w-3 h-3 bg-[#FF6B35] rounded-full"></div>
          </div>
          <Input
            placeholder="Prise en charge"
            value={pickup?.address || ''}
            onChange={(e) => setPickup(e.target.value ? { address: e.target.value, coordinates: [-15.3094, 4.3276] } : null)}
            className="pl-10 h-12 rounded-xl border-grey-200 text-grey-900 placeholder-grey-500"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#FF6B35] text-xs"
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
            <MapPin className="w-4 h-4 text-[#e53e3e]" />
          </div>
          <Input
            placeholder="Adresse de livraison"
            value={destination?.address || ''}
            onChange={(e) => setDestination(e.target.value ? { address: e.target.value, coordinates: [-15.2094, 4.4276] } : null)}
            className="pl-10 h-12 rounded-xl border-grey-200 text-grey-900 placeholder-grey-500"
          />
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className="px-4 py-4">
        <h3 className="font-semibold text-grey-900 mb-3">Type de livraison</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {vehicleOptions.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={`flex-shrink-0 w-32 p-3 cursor-pointer transition-all duration-200 ${
                selectedVehicle === vehicle.id
                  ? 'border-[#FF6B35] bg-orange-50 shadow-md'
                  : 'border-grey-200 hover:border-grey-300'
              }`}
              onClick={() => setSelectedVehicle(vehicle.id)}
            >
              <div className="text-center space-y-2">
                <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedVehicle === vehicle.id ? 'bg-[#FF6B35] text-white' : 'bg-grey-100 text-grey-600'
                }`}>
                  {vehicle.icon}
                </div>
                <div>
                  <p className="font-medium text-sm text-grey-900">{vehicle.name}</p>
                  <p className="text-xs text-grey-600">{vehicle.time}</p>
                  <p className="font-bold text-[#FF6B35] text-sm">
                    {(vehicle.price * (isBusinessMode ? 1.2 : 1)).toLocaleString()} FC
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* More Info Toggle */}
      <div className="px-4">
        <Button
          variant="ghost"
          className="w-full justify-between text-grey-600 h-10"
          onClick={() => setShowMoreInfo(!showMoreInfo)}
        >
          <span className="text-sm">Plus d'informations</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`} />
        </Button>
        
        {showMoreInfo && (
          <div className="mt-3 space-y-3 p-4 bg-grey-50 rounded-xl">
            <div className="flex items-center gap-3 text-sm text-grey-600">
              <Shield className="w-4 h-4" />
              <span>Assurance incluse jusqu'à 50,000 FC</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-grey-600">
              <Clock className="w-4 h-4" />
              <span>Suivi en temps réel</span>
            </div>
            <Separator />
            <p className="text-xs text-grey-500">
              {selectedOption?.description}
            </p>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA Button Yango-style */}
      <div className="p-4 bg-white border-t border-grey-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-grey-600">Prix estimé</span>
          <span className="font-bold text-lg text-grey-900">
            {calculatePrice().toLocaleString()} FC
          </span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination}
          className="w-full h-14 bg-[#e53e3e] hover:bg-[#c53030] text-white font-semibold text-lg rounded-xl shadow-lg"
        >
          Choisir la méthode de livraison
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full mt-2 text-grey-600"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default ModernDeliveryInterface;