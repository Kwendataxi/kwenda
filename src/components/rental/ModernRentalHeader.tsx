import React from 'react';
import { MapPin, Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModernRentalHeaderProps {
  userLocation: string;
  setUserLocation: (city: string) => void;
  availableCities: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const ModernRentalHeader: React.FC<ModernRentalHeaderProps> = ({
  userLocation,
  setUserLocation,
  availableCities,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="sticky top-[60px] z-40 bg-background/98 backdrop-blur-xl border-b shadow-sm">
      <div className="max-w-7xl mx-auto p-4 space-y-3">
        {/* Row 1: Ville + Quick Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <Select value={userLocation} onValueChange={setUserLocation}>
              <SelectTrigger className="w-auto border-0 shadow-none font-semibold h-auto p-0 hover:text-primary transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Search bar full width */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher véhicule, marque, agence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl border-2"
          />
        </div>
      </div>
    </div>
  );
};
