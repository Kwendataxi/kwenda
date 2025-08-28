import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarDays, Car, MapPin, Users, Star, Clock, DollarSign } from 'lucide-react';

interface RentalVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  fuel_type: string;
  transmission: string;
  seats: number;
  daily_rate: number;
  hourly_rate: number;
  weekly_rate: number;
  security_deposit: number;
  features: string[];
  images: string[];
  location_address: string;
  city: string;
  comfort_level: string;
  equipment: string[];
  is_active: boolean;
  is_available: boolean;
  moderation_status: string;
}

const ClientRentalInterface = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const [priceRange, setPriceRange] = useState<[number, number]>([10000, 100000]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');

  // Fetch available vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['client-rental-vehicles', selectedCity, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('rental_vehicles')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .eq('city', selectedCity)
        .order('daily_rate', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RentalVehicle[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesPrice = vehicle.daily_rate >= priceRange[0] && vehicle.daily_rate <= priceRange[1];
    const matchesType = selectedVehicleType === 'all' || vehicle.vehicle_type === selectedVehicleType;
    return matchesPrice && matchesType;
  });

  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.vehicle_type)));

  const formatPrice = (price: number) => `${price.toLocaleString()} CDF`;

  const handleBooking = (vehicleId: string) => {
    // TODO: Implement booking logic
    console.log('Booking vehicle:', vehicleId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des véhicules disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Location de Véhicules</h1>
        <p className="text-muted-foreground">
          Trouvez le véhicule parfait pour vos besoins à Kinshasa
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rechercher</label>
              <Input
                placeholder="Nom, marque, modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ville</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="Kinshasa">Kinshasa</option>
                <option value="Lubumbashi">Lubumbashi</option>
                <option value="Kolwezi">Kolwezi</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type de véhicule</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
              >
                <option value="all">Tous types</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Budget: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                  className="w-full"
                />
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredVehicles.length} véhicule(s) disponible(s)
          </h2>
          {filteredVehicles.length === 0 && vehicles.length > 0 && (
            <p className="text-muted-foreground">
              Essayez d'ajuster vos filtres pour voir plus de résultats
            </p>
          )}
        </div>

        {filteredVehicles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun véhicule disponible</h3>
              <p className="text-muted-foreground mb-4">
                Nous n'avons trouvé aucun véhicule correspondant à vos critères.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVehicleType('all');
                  setPriceRange([10000, 100000]);
                }}
              >
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {vehicle.images.length > 0 ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="bg-green-600">
                      Disponible
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                      <CardDescription>
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(vehicle.daily_rate)}
                      </p>
                      <p className="text-sm text-muted-foreground">par jour</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{vehicle.seats} places</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{vehicle.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPrice(vehicle.hourly_rate)}/h</span>
                    </div>
                  </div>

                  {vehicle.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Équipements:</p>
                      <div className="flex flex-wrap gap-1">
                        {vehicle.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {vehicle.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{vehicle.features.length - 3} autres
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleBooking(vehicle.id)}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Réserver maintenant
                    </Button>
                    <div className="text-center text-xs text-muted-foreground">
                      Caution: {formatPrice(vehicle.security_deposit)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRentalInterface;