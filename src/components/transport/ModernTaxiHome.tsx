import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UniversalLocationSearch } from '@/components/location/UniversalLocationSearch';
import { usePromotionalAds } from '@/hooks/usePromotionalAds';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedGeolocation } from '@/hooks/useEnhancedGeolocation';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Car, 
  Users, 
  Calendar, 
  Clock, 
  Star,
  ArrowRight,
  Home as HomeIcon,
  Zap,
  Leaf,
  DollarSign,
  Navigation
} from 'lucide-react';

interface ModernTaxiHomeProps {
  onDestinationSelect: (destination: { address: string; coordinates?: { lat: number; lng: number } }) => void;
  onModeSelect: (mode: 'ride' | 'intercity' | 'rental') => void;
  recentRides?: any[];
}

const BOOKING_MODES = [
  {
    id: 'ride',
    title: 'Ride',
    subtitle: 'Course normale',
    icon: Car,
    color: 'bg-primary',
    description: 'Trajets quotidiens en ville'
  },
  {
    id: 'intercity',
    title: 'Intercity',
    subtitle: 'Longue distance',
    icon: Navigation,
    color: 'bg-blue-500',
    description: 'Voyages entre villes'
  },
  {
    id: 'rental',
    title: 'Rental',
    subtitle: 'Location',
    icon: Calendar,
    color: 'bg-green-500',
    description: 'Location de véhicules'
  }
];

export const ModernTaxiHome = ({ 
  onDestinationSelect, 
  onModeSelect,
  recentRides = [] 
}: ModernTaxiHomeProps) => {
  const { user } = useAuth();
  const { ads, loading: adsLoading, trackAdImpression, trackAdClick } = usePromotionalAds();
  const { enhancedData } = useEnhancedGeolocation({ enableBackgroundTracking: false });
  const [currentLocation, setCurrentLocation] = useState<string>('Détection...');

  useEffect(() => {
    if (enhancedData?.accuracy && enhancedData.latitude && enhancedData.longitude) {
      setCurrentLocation('Kinshasa, RDC');
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
      onModeSelect('ride'); // Default to ride for transport services
    }
  };

  const displayedAds = ads.slice(0, 2); // Show max 2 ads

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Où allez-vous ?</h1>
            <p className="text-muted-foreground">Votre transport à portée de main</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary" />
          </div>
        </div>

        {/* Main Search Bar */}
        <Card className="mb-6 shadow-lg border-0 bg-white">
          <CardContent className="p-4">
            <input 
              type="text"
              placeholder="Entrez votre destination"
              className="w-full border-0 shadow-none text-lg bg-transparent focus:outline-none"
              onFocus={() => {
                // TODO: Implement search functionality
                console.log('Search focus');
              }}
            />
            
            {/* Current Location */}
            <div className="flex items-center mt-4 pt-4 border-t border-border">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
              <div className="flex-1">
                <div className="flex items-center">
                  <HomeIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Votre position</span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {currentLocation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 space-y-6">
        {/* Promotional Ads */}
        {!adsLoading && displayedAds.length > 0 && (
          <div className="space-y-4">
            {displayedAds.map((ad, index) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] shadow-lg border-0"
                  onClick={() => handleAdClick(ad)}
                >
                  <CardContent className="p-0">
                    <div className="relative h-24 bg-gradient-to-r from-primary to-primary/80">
                      {ad.image_url && (
                        <img 
                          src={ad.image_url} 
                          alt={ad.title}
                          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
                        />
                      )}
                      <div className="absolute inset-0 p-4 flex items-center justify-between text-white">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            {ad.title.includes('Green') && <Leaf className="w-4 h-4 mr-2" />}
                            {ad.title.includes('Cheaper') && <DollarSign className="w-4 h-4 mr-2" />}
                            <h3 className="font-bold text-lg">{ad.title}</h3>
                          </div>
                          <p className="text-white/90 text-sm">{ad.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {ad.cta_text}
                          </Badge>
                          <ArrowRight className="w-5 h-5 mt-2 ml-auto" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Way to Book Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Comment réserver</h2>
          <div className="grid grid-cols-3 gap-3">
            {BOOKING_MODES.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer transition-transform hover:scale-105 border-0 shadow-md"
                  onClick={() => onModeSelect(mode.id as any)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 ${mode.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <mode.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">{mode.title}</h3>
                    <p className="text-xs text-muted-foreground">{mode.subtitle}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Rides */}
        {recentRides.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Courses récentes</h2>
            <div className="space-y-3">
              {recentRides.slice(0, 3).map((ride, index) => (
                <motion.div
                  key={ride.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center mr-3">
                            <Car className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {ride.destination || 'Destination inconnue'}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="mr-3">{ride.date || 'Date inconnue'}</span>
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              <span>{ride.rating || '4.8'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-semibold text-foreground">
                            {ride.price ? `${ride.price.toLocaleString()} FC` : '2,500 FC'}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary p-0 h-auto"
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