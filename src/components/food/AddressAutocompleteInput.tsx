import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import type { LocationData } from '@/hooks/useSmartGeolocation';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string, location?: LocationData) => void;
  placeholder?: string;
  required?: boolean;
}

export const AddressAutocompleteInput = ({
  value,
  onChange,
  placeholder = "Entrez votre adresse complète",
  required = false
}: AddressAutocompleteInputProps) => {
  const { getCurrentPosition, loading } = useSmartGeolocation();
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      // Use simple coordinates as address
      const address = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
      
      setSelectedLocation(position);
      onChange(address, position);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="delivery-address" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Adresse de livraison {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="flex gap-2">
        <Input
          id="delivery-address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          required={required}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleUseCurrentLocation}
          disabled={loading}
          title="Utiliser ma position actuelle"
        >
          <Navigation className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {selectedLocation && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Position GPS: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          {selectedLocation.accuracy && ` (±${Math.round(selectedLocation.accuracy)}m)`}
        </div>
      )}
    </div>
  );
};
