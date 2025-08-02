import { MapPin, Clock, Star, Home, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Place {
  id: string;
  name: string;
  address: string;
  type: 'home' | 'work' | 'recent' | 'favorite';
  estimatedTime?: string;
  rating?: number;
}

interface RecentPlacesProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
}

export const RecentPlaces = ({ places, onPlaceSelect }: RecentPlacesProps) => {
  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-md text-foreground">Lieux récents</h3>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-glow">
          Voir tout
        </Button>
      </div>
      
      <div className="space-y-4">
        {places.map((place, index) => (
          <Card 
            key={place.id}
            className="group p-5 cursor-pointer border-0 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-fade-in"
            onClick={() => onPlaceSelect(place)}
            style={{ 
              boxShadow: 'var(--shadow-md)',
              background: 'var(--gradient-card)',
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center border border-primary/10 group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300"
              >
                {place.type === 'home' && <Home className="h-5 w-5 text-primary" />}
                {place.type === 'work' && <Building className="h-5 w-5 text-primary" />}
                {place.type === 'recent' && <MapPin className="h-5 w-5 text-primary" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate mb-1">{place.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{place.address}</p>
              </div>
              
              <div className="text-right flex flex-col items-end gap-1">
                <div className="px-3 py-1 bg-primary/10 rounded-full">
                  <p className="text-sm font-semibold text-primary">{place.estimatedTime}</p>
                </div>
                {place.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-secondary fill-current" />
                    <span className="text-xs font-medium text-muted-foreground">{place.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};