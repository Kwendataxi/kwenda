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
      <div className="bg-gradient-to-r from-primary to-primary-glow px-6 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-heading-md text-white">Cargo Delivery</h1>
              <p className="text-white/80 text-body-sm">Moyens et gros colis • Tous véhicules</p>
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
            className="h-44 rounded-2xl border border-border/50 shadow-md"
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
      <div className="px-6 space-y-4 mb-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="w-4 h-4 bg-primary rounded-full shadow-sm"></div>
          </div>
          <Input
            placeholder="Adresse de prise en charge"
            value={pickup?.address || ''}
            onChange={(e) => setPickup(e.target.value ? { address: e.target.value, coordinates: [-15.3094, 4.3276] } : null)}
            className="pl-12 pr-32 h-14 rounded-xl border-2 border-border focus:border-primary text-body-md bg-white shadow-sm transition-all"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-light text-caption font-medium px-2 py-1 h-8"
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
      <div className="p-6 bg-white border-t border-border/50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground text-body-md">Prix total</span>
          <span className="text-heading-lg font-bold text-primary">
            {calculatePrice().toLocaleString()} FC
          </span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination}
          className="w-full h-16 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white font-semibold text-body-lg rounded-2xl shadow-lg mb-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: 'var(--shadow-elegant)' }}
        >
          Confirmer la livraison Cargo
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

export default CargoDeliveryInterface;