import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ModernJobHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  jobCount: number;
}

const CITIES = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];

export const ModernJobHero = ({
  searchQuery,
  onSearchChange,
  location,
  onLocationChange,
  jobCount,
}: ModernJobHeroProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative px-4 pt-4 pb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Kwenda Job</h1>
          <p className="text-sm text-muted-foreground">
            {jobCount} offre{jobCount !== 1 ? 's' : ''} disponible{jobCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          flex items-center gap-2 bg-card rounded-xl border p-2.5 transition-all
          ${isFocused ? 'border-primary/50 shadow-sm' : 'border-border'}
        `}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
        <Input
          placeholder="Rechercher un emploi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-8 text-sm"
        />
        <div className="h-5 w-px bg-border shrink-0" />
        <div className="flex items-center gap-1 shrink-0">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="bg-transparent border-0 text-sm text-foreground focus:outline-none cursor-pointer pr-1"
          >
            <option value="">Toutes</option>
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Quick city filters */}
      <div className="flex items-center gap-2 mt-3">
        <Button
          variant={location === '' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLocationChange('')}
          className={`h-7 text-xs px-3 rounded-full ${location === '' ? '' : 'text-muted-foreground'}`}
        >
          Toutes
        </Button>
        {CITIES.map((city) => (
          <Button
            key={city}
            variant={location === city ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLocationChange(city)}
            className={`h-7 text-xs px-3 rounded-full ${location === city ? '' : 'text-muted-foreground'}`}
          >
            {city}
          </Button>
        ))}
      </div>
    </div>
  );
};
