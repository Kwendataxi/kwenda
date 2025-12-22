import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface City {
  name: string;
  country: string;
  emoji: string;
}

const CITIES: City[] = [
  { name: 'Kinshasa', country: 'RDC', emoji: '🇨🇩' },
  { name: 'Lubumbashi', country: 'RDC', emoji: '🇨🇩' },
  { name: 'Kolwezi', country: 'RDC', emoji: '🇨🇩' },
  { name: 'Abidjan', country: 'Côte d\'Ivoire', emoji: '🇨🇮' },
];

interface CityDropdownProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
}

export const CityDropdown = ({ selectedCity, onCityChange, className }: CityDropdownProps) => {
  const currentCity = CITIES.find(c => c.name === selectedCity) || CITIES[0];

  const handleCitySelect = (city: City) => {
    if (city.name !== selectedCity) {
      onCityChange(city.name);
      toast.success('Ville changée', {
        description: `Vous explorez maintenant ${city.name}`
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1.5 h-8 px-2 hover:bg-muted transition-colors ${className}`}
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{currentCity.emoji} {currentCity.name}</span>
          <span className="text-xs text-muted-foreground">▼</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {CITIES.map((city) => (
          <DropdownMenuItem
            key={city.name}
            onClick={() => handleCitySelect(city)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-lg">{city.emoji}</span>
            <div className="flex flex-col">
              <span className="font-medium">{city.name}</span>
              <span className="text-xs text-muted-foreground">{city.country}</span>
            </div>
            {city.name === selectedCity && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
