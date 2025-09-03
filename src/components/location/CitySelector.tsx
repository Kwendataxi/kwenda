import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPin, ChevronDown } from 'lucide-react';

interface City {
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  timezone: string;
  currency: string;
}

interface CitySelectorProps {
  currentCity: string;
  onCityChange: (city: string) => void;
  className?: string;
}

const cities: City[] = [
  {
    name: 'Kinshasa',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -4.3217, lng: 15.3069 },
    timezone: 'Africa/Kinshasa',
    currency: 'CDF'
  },
  {
    name: 'Lubumbashi',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -11.6594, lng: 27.4794 },
    timezone: 'Africa/Lubumbashi',
    currency: 'CDF'
  },
  {
    name: 'Kolwezi',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -10.7147, lng: 25.4615 },
    timezone: 'Africa/Lubumbashi',
    currency: 'CDF'
  },
  {
    name: 'Bukavu',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -2.5081, lng: 28.8473 },
    timezone: 'Africa/Lubumbashi',
    currency: 'CDF'
  },
  {
    name: 'Goma',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -1.6792, lng: 29.2228 },
    timezone: 'Africa/Lubumbashi',
    currency: 'CDF'
  },
  {
    name: 'Abidjan',
    country: 'Côte d\'Ivoire',
    coordinates: { lat: 5.3364, lng: -4.0267 },
    timezone: 'Africa/Abidjan',
    currency: 'XOF'
  }
];

const CitySelector = ({ currentCity, onCityChange, className }: CitySelectorProps) => {
  const selectedCity = cities.find(city => city.name === currentCity) || cities[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{selectedCity.name}</span>
            <Badge variant="secondary" className="text-xs">
              {selectedCity.currency}
            </Badge>
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {cities.map((city) => (
          <DropdownMenuItem
            key={city.name}
            onClick={() => onCityChange(city.name)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-medium">{city.name}</div>
              <div className="text-xs text-muted-foreground">{city.country}</div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {city.currency}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CitySelector;