import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Clock, Home, Building2 } from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
  type?: 'home' | 'work' | 'other';
}

interface LocationInputProps {
  placeholder: string;
  value: string;
  onChange: (location: Location) => void;
  onInputChange: (value: string) => void;
}

const LocationInput = ({ placeholder, value, onChange, onInputChange }: LocationInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [recentLocations] = useState<Location[]>([
    { address: "Commune de Gombe, Kinshasa", coordinates: [-15.3094, 4.3276], type: 'work' },
    { address: "Commune de Kalamu, Kinshasa", coordinates: [-15.3094, 4.3076], type: 'home' },
    { address: "Commune de Ngaliema, Kinshasa", coordinates: [-15.2894, 4.3276] },
    { address: "Aéroport de N'djili, Kinshasa", coordinates: [-15.4444, 4.3847] },
    { address: "Université de Kinshasa, Mont-Amba", coordinates: [-15.3094, 4.4276] },
  ]);

  useEffect(() => {
    if (value.length > 2) {
      // Simulation d'une recherche de lieux à Kinshasa
      const filtered = recentLocations.filter(location =>
        location.address.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [value, recentLocations]);

  const handleLocationSelect = (location: Location) => {
    onChange(location);
    onInputChange(location.address);
    setIsOpen(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            address: "Ma position actuelle",
            coordinates: [position.coords.longitude, position.coords.latitude]
          };
          handleLocationSelect(location);
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  };

  const savedPlaces = [
    { icon: Home, label: "Domicile", address: "Commune de Kalamu", type: 'home' as const },
    { icon: Building2, label: "Bureau", address: "Commune de Gombe", type: 'work' as const },
  ];

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onInputChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-white rounded-xl border-grey-100 h-12 pl-4 pr-12"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            className="h-8 w-8 p-0"
          >
            <MapPin className="h-4 w-4 text-grey-400" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-grey-100 shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Current Location */}
          <div className="p-2 border-b border-grey-100">
            <button
              onClick={getCurrentLocation}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-grey-900">Ma position actuelle</p>
                <p className="text-sm text-grey-600">Utiliser le GPS</p>
              </div>
            </button>
          </div>

          {/* Saved Places */}
          {value.length === 0 && (
            <div className="p-2 border-b border-grey-100">
              <h4 className="text-sm font-medium text-grey-700 px-3 py-2">Lieux enregistrés</h4>
              {savedPlaces.map((place, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect({
                    address: place.address,
                    coordinates: [-15.3094, 4.3276],
                    type: place.type
                  })}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
                    <place.icon className="h-4 w-4 text-grey-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-grey-900">{place.label}</p>
                    <p className="text-sm text-grey-600">{place.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <h4 className="text-sm font-medium text-grey-700 px-3 py-2">Suggestions</h4>
              {suggestions.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
                    <Search className="h-4 w-4 text-grey-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-grey-900">{location.address}</p>
                    <p className="text-sm text-grey-600">Kinshasa, RDC</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Locations */}
          {value.length === 0 && (
            <div className="p-2">
              <h4 className="text-sm font-medium text-grey-700 px-3 py-2">Récemment</h4>
              {recentLocations.slice(0, 3).map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-grey-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-grey-900">{location.address}</p>
                    <p className="text-sm text-grey-600">Récent</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;