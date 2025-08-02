import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InteractiveMap from '@/components/transport/InteractiveMap';
import VehicleSizeSelector, { VehicleSize } from './VehicleSizeSelector';
import LoadingAssistanceToggle from './LoadingAssistanceToggle';
import { 
  MapPin, 
  Truck,
  Target,
  Package
} from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface CargoDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CargoDeliveryInterface = ({ onSubmit, onCancel }: CargoDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('size-s');
  const [hasAssistance, setHasAssistance] = useState(false);

  const vehicleSizes: VehicleSize[] = [
    {
      id: 'tricycle',
      name: 'Tricycle',
      description: 'Petit volume',
      dimensions: '60x40x30 cm',
      maxWeight: '20 kg',
      price: 800,
      examples: ['Cartons moyens', 'Appareils ménagers']
    },
    {
      id: 'size-s',
      name: 'Taille S',
      description: 'Coffre standard',
      dimensions: '80x60x40 cm',
      maxWeight: '40 kg',
      price: 1500,
      examples: ['Télévision', 'Micro-ondes', 'Caisses']
    },
    {
      id: 'size-m',
      name: 'Taille M',
      description: 'Pick-up compact',
      dimensions: '120x80x60 cm',
      maxWeight: '80 kg',
      price: 2500,
      examples: ['Réfrigérateur', 'Lave-linge', 'Matelas']
    },
    {
      id: 'size-l',
      name: 'Taille L',
      description: 'Camionnette',
      dimensions: '200x120x100 cm',
      maxWeight: '150 kg',
      price: 4000,
      examples: ['Gazinière', 'Armoire', 'Canapé']
    },
    {
      id: 'size-xl',
      name: 'Taille XL',
      description: 'Grand camion',
      dimensions: '300x150x150 cm',
      maxWeight: '300 kg',
      price: 6500,
      examples: ['Déménagement', 'Mobilier complet', 'Gros électroménager']
    }
  ];

  const selectedVehicle = vehicleSizes.find(v => v.id === selectedSize);
  
  const calculatePrice = () => {
    const basePrice = selectedVehicle?.price || 0;
    const assistancePrice = hasAssistance ? 500 : 0;
    const distance = pickup && destination ? 2.5 : 0; // Mock distance
    return Math.round(basePrice + assistancePrice + (distance * 200));
  };

  const handleSubmit = () => {
    if (!pickup || !destination || !selectedVehicle) return;
    
    onSubmit({
      mode: 'cargo',
      pickup,
      destination,
      vehicleSize: selectedSize,
      hasAssistance,
      price: calculatePrice(),
      estimatedTime: '30-60 min'
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header Cargo-style */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" />
            <div>
              <h1 className="font-semibold text-lg">Cargo Delivery</h1>
              <p className="text-red-100 text-sm">Moyens et gros colis • Tous véhicules</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-red-100 text-xs">Prix estimé</p>
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
          className="h-40 rounded-2xl"
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
      <div className="px-4 space-y-3 mb-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-xs"
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Vehicle Size Selection */}
        <VehicleSizeSelector
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
        />

        {/* Loading Assistance */}
        <LoadingAssistanceToggle
          hasAssistance={hasAssistance}
          onToggle={setHasAssistance}
        />
      </div>

      {/* CTA Button */}
      <div className="p-4 bg-white border-t border-grey-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-grey-600">Prix total</span>
          <span className="font-bold text-lg text-grey-900">
            {calculatePrice().toLocaleString()} FC
          </span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination}
          className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-semibold text-lg rounded-xl shadow-lg mb-2"
        >
          Confirmer la livraison Cargo
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

export default CargoDeliveryInterface;