import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Car, MapPin, Clock, DollarSign, Star, Calendar, Users, Fuel, Cog, Search, SlidersHorizontal, GitCompare } from 'lucide-react';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useNavigate } from 'react-router-dom';
import { VehicleGridSkeleton } from '@/components/ui/skeleton-cards';
import { VehicleComparisonDialog } from '@/components/rental/VehicleComparisonDialog';
import { AdvancedFiltersDialog } from '@/components/rental/AdvancedFiltersDialog';

interface AdvancedFilters {
  priceRange: [number, number];
  comfortLevels: string[];
  equipments: string[];
  seats: number | null;
  transmission: string | null;
  fuelType: string | null;
  driverAvailable: boolean | null;
}

const defaultFilters: AdvancedFilters = {
  priceRange: [10000, 200000],
  comfortLevels: [],
  equipments: [],
  seats: null,
  transmission: null,
  fuelType: null,
  driverAvailable: null,
};

export const ClientRentalInterface = () => {
  const navigate = useNavigate();
  const { 
    userLocation, 
    setUserLocation, 
    categories, 
    vehicles, 
    availableCities,
    isLoading,
    getVehiclesByCategory,
    calculateCityPrice 
  } = useModernRentals();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AdvancedFilters>(defaultFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Filtrage intelligent avec mémoisation
  const filteredVehicles = useMemo(() => {
    let result = selectedCategory 
      ? getVehiclesByCategory(selectedCategory)
      : vehicles;

    // Recherche par nom, marque, modèle
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(search) ||
        v.brand.toLowerCase().includes(search) ||
        v.model.toLowerCase().includes(search)
      );
    }

    // Filtres avancés
    result = result.filter(v => {
      const price = calculateCityPrice(v.daily_rate, v.category_id);
      const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      const matchesComfort = filters.comfortLevels.length === 0 || filters.comfortLevels.includes(v.comfort_level);
      const matchesSeats = !filters.seats || v.seats >= filters.seats;
      const matchesTransmission = !filters.transmission || v.transmission === filters.transmission;
      const matchesFuel = !filters.fuelType || v.fuel_type === filters.fuelType;
      const matchesDriver = filters.driverAvailable === null || v.driver_available === filters.driverAvailable;
      const matchesEquipments = filters.equipments.length === 0 || 
        filters.equipments.every(eq => v.equipment.includes(eq));

      return matchesPrice && matchesComfort && matchesSeats && matchesTransmission && 
             matchesFuel && matchesDriver && matchesEquipments;
    });

    return result;
  }, [vehicles, selectedCategory, searchTerm, filters, getVehiclesByCategory, calculateCityPrice]);

  const toggleCompare = (vehicleId: string) => {
    setCompareList(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 véhicules
      }
      return [...prev, vehicleId];
    });
  };

  const compareVehicles = vehicles.filter(v => compareList.includes(v.id));

  const activeFiltersCount = 
    (filters.comfortLevels.length > 0 ? 1 : 0) +
    (filters.equipments.length > 0 ? 1 : 0) +
    (filters.seats !== null ? 1 : 0) +
    (filters.transmission !== null ? 1 : 0) +
    (filters.fuelType !== null ? 1 : 0) +
    (filters.driverAvailable !== null ? 1 : 0);

  if (isLoading) {
    return <VehicleGridSkeleton count={6} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Kwenda Location
                </h1>
                <p className="text-sm text-muted-foreground">Louez un véhicule près de chez vous</p>
              </div>
            </div>
            
            {/* City Selector */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <select
                value={userLocation}
                onChange={(e) => setUserLocation(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                {availableCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, marque ou modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              {compareList.length > 0 && (
                <Button
                  variant="default"
                  onClick={() => setIsCompareOpen(true)}
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  Comparer ({compareList.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" onClick={() => setSelectedCategory(null)}>
              Tous ({vehicles.length})
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name} ({getVehiclesByCategory(cat.id).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory || "all"} className="mt-6">
            {filteredVehicles.length === 0 ? (
              <Card className="glassmorphism">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Car className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun véhicule disponible</h3>
                  <p className="text-muted-foreground text-center">
                    Aucun véhicule n'est disponible à {userLocation} pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="glassmorphism hover:shadow-lg transition-shadow">
                    <CardHeader className="p-0">
                      {vehicle.images.length > 0 ? (
                        <img 
                          src={vehicle.images[0]} 
                          alt={vehicle.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Badge variant="default" className="bg-background/80 backdrop-blur">
                          {vehicle.comfort_level}
                        </Badge>
                        <Button
                          size="icon"
                          variant={compareList.includes(vehicle.id) ? 'default' : 'secondary'}
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(vehicle.id);
                          }}
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{vehicle.seats} places</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <span>{vehicle.fuel_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Cog className="h-4 w-4 text-muted-foreground" />
                          <span>{vehicle.transmission}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{vehicle.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {vehicle.equipment.slice(0, 3).map((eq) => (
                          <Badge key={eq} variant="secondary" className="text-xs">
                            {eq.replace('_', ' ')}
                          </Badge>
                        ))}
                        {vehicle.equipment.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{vehicle.equipment.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Par heure</span>
                          </div>
                          <span className="font-semibold">
                            {calculateCityPrice(vehicle.hourly_rate, vehicle.category_id).toLocaleString()} CDF
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Par jour</span>
                          </div>
                          <span className="font-semibold text-primary">
                            {calculateCityPrice(vehicle.daily_rate, vehicle.category_id).toLocaleString()} CDF
                          </span>
                        </div>
                      </div>

                      <Button className="w-full" onClick={() => navigate(`/rental-booking/${vehicle.id}`)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Réserver maintenant
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AdvancedFiltersDialog
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      <VehicleComparisonDialog
        open={isCompareOpen}
        onOpenChange={setIsCompareOpen}
        vehicles={compareVehicles}
        onRemove={(id) => setCompareList(prev => prev.filter(v => v !== id))}
        onBook={(id) => navigate(`/rental-booking/${id}`)}
      />
    </div>
  );
};

export default ClientRentalInterface;
