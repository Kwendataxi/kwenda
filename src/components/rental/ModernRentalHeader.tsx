import React from 'react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
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
    <div className="sticky top-[60px] z-40">
      {/* Header clean */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto p-4 space-y-3">
          {/* Row 1: Logo + City Selector */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Logo statique */}
              <span className="text-2xl">🚗</span>

              {/* City Selector sobre */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Select value={userLocation} onValueChange={setUserLocation}>
                  <SelectTrigger className="w-auto border-0 shadow-none font-semibold text-base h-auto p-0 hover:text-primary transition-colors bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter button */}
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-lg"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Row 2: Search bar sobre */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher véhicule, marque, agence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-lg bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
