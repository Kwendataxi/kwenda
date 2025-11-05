import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface PopularPlace {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

interface PopularPlacesListProps {
  places: PopularPlace[];
  onSelectPlace: (place: PopularPlace) => void;
}

export default function PopularPlacesList({ places, onSelectPlace }: PopularPlacesListProps) {
  if (!places || places.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5 mt-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 px-2">Lieux fréquents</h3>
      {places.slice(0, 5).map((place, index) => (
        <motion.button
          key={place.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectPlace(place)}
          className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-xl"
        >
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">{place.name}</p>
            {place.address && (
              <p className="text-xs text-muted-foreground">{place.address}</p>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
