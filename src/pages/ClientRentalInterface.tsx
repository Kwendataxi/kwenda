import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useModernRentals } from '@/hooks/useModernRentals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, Car, User, Users, Settings, MapPin, 
  Calendar as CalendarIcon
} from 'lucide-react';
import { RentalPromoSlider } from '@/components/rental/RentalPromoSlider';
import { getVehicleImage, getVehicleGradient } from '@/utils/vehicleFallbackImages';

export const ClientRentalInterface = () => {
  const navigate = useNavigate();
  const { 
    vehicles, 
    categories, 
    isLoading, 
    userLocation, 
    setUserLocation, 
    availableCities,
    calculateCityPrice 
  } = useModernRentals();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtrage des véhicules
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch = !searchTerm || 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || v.category_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [vehicles, searchTerm, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/98 backdrop-blur-xl border-b shadow-sm p-3">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 bg-muted rounded w-40 mb-3 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-muted" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Minimaliste */}
      <div className="sticky top-0 z-50 bg-background/98 backdrop-blur-xl border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-3">
          {/* Titre + Ville */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Kwenda Location</h1>
            <select
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          {/* Recherche unique */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, marque ou modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Slider publicitaire */}
      <div className="max-w-7xl mx-auto px-3 pt-4">
        <RentalPromoSlider />
      </div>

      {/* Catégories Horizontales Scrollables */}
      <div className="sticky top-[110px] z-40 bg-background/98 backdrop-blur-xl border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 min-w-max">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap text-xs"
            >
              Tous ({vehicles.length})
            </Button>
            {categories.map((cat) => {
              const count = vehicles.filter(v => v.category_id === cat.id).length;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap text-xs"
                >
                  {cat.name} ({count})
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Indicateur de résultats */}
      <div className="max-w-7xl mx-auto px-3 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? 's' : ''} 
            {searchTerm && ` pour "${searchTerm}"`}
          </p>
          {(searchTerm || selectedCategory) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
            >
              Effacer tout
            </Button>
          )}
        </div>
      </div>

      {/* Liste des véhicules - Design moderne et compact */}
      <div className="max-w-7xl mx-auto px-3 pb-6">
        {filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 p-6 bg-muted rounded-full">
              <Car className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun véhicule disponible</h3>
            <p className="text-muted-foreground max-w-md">
              {searchTerm 
                ? `Aucun résultat pour "${searchTerm}". Essayez une autre recherche.`
                : `Pas de véhicule disponible à ${userLocation} actuellement.`}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Effacer la recherche
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredVehicles.map((vehicle, index) => {
              const dailyRate = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
                ? vehicle.without_driver_daily_rate
                : vehicle.daily_rate;
              
              const vehicleImage = getVehicleImage(vehicle);
              const hasRealImage = vehicle.images?.[0] && vehicle.images[0] !== '/placeholder.svg';
              
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-primary"
                    onClick={() => navigate(`/rental-booking/${vehicle.id}`)}
                  >
                    {/* Image - Réduite à h-32 */}
                    <div className="relative h-32 overflow-hidden">
                      {hasRealImage ? (
                        <img 
                          src={vehicleImage} 
                          alt={vehicle.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`flex items-center justify-center h-full bg-gradient-to-br ${getVehicleGradient(vehicle)}`}>
                          <Car className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                      
                      {/* Badges - Plus petits et discrets */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge className="bg-background/80 backdrop-blur text-[10px] py-0 px-1.5">
                          {vehicle.comfort_level}
                        </Badge>
                        {vehicle.driver_available && (
                          <Badge className="bg-green-500/80 text-white text-[10px] py-0 px-1.5">
                            <User className="h-2.5 w-2.5 mr-0.5" />
                            Chauffeur
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-3 space-y-2">
                      {/* Nom - Plus compact */}
                      <div>
                        <h3 className="font-bold text-base leading-tight line-clamp-1">{vehicle.name}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {vehicle.brand} {vehicle.model} · {vehicle.year}
                        </p>
                      </div>

                      {/* Infos - Une ligne */}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {vehicle.seats}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Settings className="h-2.5 w-2.5" />
                          {vehicle.transmission === 'automatic' ? 'Auto' : 'Man'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {vehicle.city}
                        </span>
                      </div>

                      {/* Prix - Compact et clair */}
                      <div className="pt-2 border-t flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">À partir de</p>
                          <p className="text-lg font-bold text-primary">
                            {calculateCityPrice(dailyRate, vehicle.category_id).toLocaleString()} 
                            <span className="text-xs ml-1">CDF/j</span>
                          </p>
                        </div>
                        <Button size="sm" className="h-8 text-xs">
                          Réserver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRentalInterface;
