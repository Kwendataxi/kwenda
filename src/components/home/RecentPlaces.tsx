import { MapPin, Clock, Star } from 'lucide-react';
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
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lieux récents</h3>
        <Button variant="ghost" size="sm" className="text-gray-500">
          Voir tout
        </Button>
      </div>
      
      <div className="space-y-3">
        {places.map((place) => (
          <Card 
            key={place.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
            onClick={() => onPlaceSelect(place)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                {place.type === 'home' ? (
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                ) : place.type === 'work' ? (
                  <div className="w-4 h-4 bg-orange-500 rounded" />
                ) : (
                  <MapPin className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-sm text-gray-500">{place.address}</p>
              </div>
              
              <div className="text-right">
                {place.estimatedTime && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{place.estimatedTime}</span>
                  </div>
                )}
                {place.rating && (
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{place.rating}</span>
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