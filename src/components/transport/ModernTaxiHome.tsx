import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePromotionalAds } from '@/hooks/usePromotionalAds';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedGeolocation } from '@/hooks/useEnhancedGeolocation';
import { ZoneService } from '@/services/zoneService';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Car, 
  Clock, 
  Star,
  ArrowRight,
  Home as HomeIcon,
  Leaf,
  DollarSign,
  Search
} from 'lucide-react';

interface ModernTaxiHomeProps {
  onDestinationSelect: (destination: { address: string; coordinates?: { lat: number; lng: number } }) => void;
  onModeSelect: (mode: 'ride') => void;
  recentRides?: any[];
}


export const ModernTaxiHome = ({ 
  onDestinationSelect, 
  onModeSelect,
  recentRides = [] 
}: ModernTaxiHomeProps) => {
  const { user } = useAuth();
  const { ads, loading: adsLoading, trackAdImpression, trackAdClick } = usePromotionalAds();
  const { enhancedData } = useEnhancedGeolocation({ enableBackgroundTracking: false });
  const [currentLocation, setCurrentLocation] = useState<string>('Détection...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (enhancedData?.accuracy && enhancedData.latitude && enhancedData.longitude) {
      // Detect zone based on coordinates
      const zone = ZoneService.getZoneByPoint(enhancedData.longitude, enhancedData.latitude);
      if (zone) {
        setCurrentLocation(`${zone.nameFr}, ${zone.id.includes('abidjan') ? 'Abidjan' : 'RDC'}`);
      } else {
        setCurrentLocation('Kinshasa, RDC');
      }
    }
  }, [enhancedData]);

  useEffect(() => {
    // Track ad impressions when component loads
    ads.forEach(ad => {
      trackAdImpression(ad.id);
    });
  }, [ads]);

  const handleAdClick = (ad: any) => {
    trackAdClick(ad.id);
    
    if (ad.cta_action === 'service' && ad.cta_target) {
      onModeSelect('ride');
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim().length > 2) {
      const results = ZoneService.searchPopularPlaces(value, 5);
      setSearchResults(results);
      setShowSuggestions(true);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const handleDestinationClick = (place: any) => {
    onDestinationSelect({
      address: place.address,
      coordinates: { lat: place.coordinates[1], lng: place.coordinates[0] }
    });
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const displayedAds = ads.slice(0, 1); // Show max 1 ad for space optimization

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pb-6">
      {/* Simple Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Transport</h1>
            <p className="text-sm text-muted-foreground">Service de course</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary" />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Single Booking Button */}
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card 
              className="cursor-pointer transition-transform hover:scale-[1.02] border-0 shadow-lg bg-primary"
              onClick={() => onModeSelect('ride')}
            >
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Car className="w-6 h-6 text-white mr-3" />
                  <h3 className="font-bold text-white text-lg">Réserver une course</h3>
                </div>
                <p className="text-white/90 text-sm">Transport rapide en ville</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Rides - Compact */}
        {recentRides.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">Récentes</h2>
            <div className="space-y-2">
              {recentRides.slice(0, 2).map((ride, index) => (
                <motion.div
                  key={ride.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center mr-3">
                            <Car className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate text-sm">
                              {ride.destination || 'Destination inconnue'}
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="mr-2">{ride.date || 'Récent'}</span>
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              <span>{ride.rating || '4.8'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-semibold text-foreground text-sm">
                            {ride.price ? `${ride.price.toLocaleString()} FC` : '2,500 FC'}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary p-0 h-auto text-xs"
                            onClick={() => {
                              onDestinationSelect({
                                address: ride.destination || 'Destination'
                              });
                            }}
                          >
                            Re-book
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};