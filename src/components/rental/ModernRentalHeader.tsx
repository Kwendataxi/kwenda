import React from 'react';
import { motion } from 'framer-motion';
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
      {/* Accent line animée */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Header glassmorphism */}
      <div className="bg-background/80 backdrop-blur-2xl border-b shadow-lg">
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          {/* Row 1: Logo + City Selector */}
          <div className="flex items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Logo animé */}
              <div className="relative">
                <motion.div
                  className="text-2xl"
                  animate={{ 
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🚗
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>

              {/* City Selector premium */}
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <MapPin className="h-4 w-4 text-emerald-500" />
                </motion.div>
                <Select value={userLocation} onValueChange={setUserLocation}>
                  <SelectTrigger className="w-auto border-0 shadow-none font-bold text-lg h-auto p-0 hover:text-emerald-500 transition-colors bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-emerald-500/20">
                    {availableCities.map(city => (
                      <SelectItem 
                        key={city} 
                        value={city}
                        className="hover:bg-emerald-500/10 focus:bg-emerald-500/10"
                      >
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Filter button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-xl border-2 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-300"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Row 2: Search bar premium */}
          <motion.div 
            className="relative group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Glow effect on focus */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-green-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-lg transition-opacity duration-300" />
            
            <div className="relative">
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2"
                whileHover={{ scale: 1.1 }}
              >
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
              </motion.div>
              <Input
                placeholder="Rechercher véhicule, marque, agence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-2 border-muted bg-background/60 backdrop-blur-sm focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 text-base"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
