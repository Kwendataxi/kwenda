import { Search, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useCallback, useEffect } from 'react';
import { GeocodingService, GeocodeResult } from '@/services/geocoding';
import { usePlaces } from '@/hooks/usePlaces';
import { useAuth } from '@/hooks/useAuth';

interface UniversalSearchBarProps {
  onSearch: (query: string) => void;
  onTransportSelect: () => void;
  placeholder?: string;
}

export const UniversalSearchBar = ({ 
  onSearch, 
  onTransportSelect,
  placeholder = "Où allez-vous ?" 
}: UniversalSearchBarProps) => {
  const { user } = useAuth();
  const { searchAndSave, recentPlaces } = usePlaces();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debounced search
  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await GeocodingService.searchPlaces(searchQuery);
      setSuggestions(results);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && showSuggestions) {
        searchPlaces(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showSuggestions, searchPlaces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await handlePlaceSelect(query);
    }
  };

  const handlePlaceSelect = async (placeName: string, coordinates?: { lat: number; lng: number }) => {
    try {
      if (user) {
        await searchAndSave(placeName, coordinates);
      }
      onTransportSelect();
      onSearch(placeName);
      setQuery('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Erreur lors de la sélection du lieu:', error);
      // Continue anyway
      onTransportSelect();
      onSearch(placeName);
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay hiding to allow clicks on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="px-4 mb-8">
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          </div>
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="pl-12 pr-4 h-14 bg-white border-0 rounded-2xl text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all duration-200"
            style={{ 
              boxShadow: 'var(--shadow-md)',
              background: 'var(--gradient-card)'
            }}
          />
          {/* Effet de brillance */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && (query.length > 0 || recentPlaces.length > 0) && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-0 z-50 max-h-80 overflow-y-auto"
            style={{ 
              boxShadow: 'var(--shadow-lg)',
              background: 'var(--gradient-card)'
            }}
          >
            {/* Recent places */}
            {query.length === 0 && recentPlaces.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Lieux récents
                </h3>
                {recentPlaces.slice(0, 3).map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handlePlaceSelect(place.name, place.coordinates)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors text-left"
                  >
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{place.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Search suggestions */}
            {query.length > 0 && (
              <div className="p-4">
                {loading && (
                  <div className="flex items-center justify-center p-4">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {!loading && suggestions.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Suggestions
                    </h3>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handlePlaceSelect(suggestion.place_name, {
                          lat: suggestion.center[1],
                          lng: suggestion.center[0]
                        })}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors text-left"
                      >
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{suggestion.place_name}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {!loading && suggestions.length === 0 && query.length > 0 && (
                  <p className="text-center text-muted-foreground p-4">Aucun résultat trouvé</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};