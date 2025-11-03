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
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b p-4">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 bg-muted rounded w-40 mb-4 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded" />
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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-4">
          {/* Titre + Ville */}
          <div className="flex items-center justify-between mb-4">
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

      {/* Catégories Horizontales Scrollables */}
      <div className="sticky top-[120px] z-9 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
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
                  className="whitespace-nowrap"
                >
                  {cat.name} ({count})
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Indicateur de résultats */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
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
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {filteredVehicles.length === 0 ? (
          <Card className="glassmorphism">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun véhicule trouvé</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || selectedCategory 
                  ? "Essayez de modifier vos critères de recherche"
                  : `Aucun véhicule disponible à ${userLocation} pour le moment.`}
              </p>
              {(searchTerm || selectedCategory) && (
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                }}>
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => {
              const dailyRate = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
                ? vehicle.without_driver_daily_rate
                : vehicle.daily_rate;
              
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/rental-booking/${vehicle.id}`)}
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                      {vehicle.images[0] && vehicle.images[0] !== '/placeholder.svg' ? (
                        <img 
                          src={vehicle.images[0]} 
                          alt={vehicle.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Car className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Badge catégorie */}
                      <Badge className="absolute top-2 left-2 bg-background/90 backdrop-blur text-xs">
                        {vehicle.comfort_level}
                      </Badge>
                      
                      {/* Badge chauffeur */}
                      {vehicle.driver_available && (
                        <Badge className="absolute top-2 right-2 bg-green-500/90 text-white text-xs">
                          <User className="h-3 w-3 mr-1" />
                          Chauffeur
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Nom véhicule */}
                      <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1">{vehicle.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.brand} {vehicle.model} · {vehicle.year}
                        </p>
                      </div>

                      {/* Infos rapides */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {vehicle.seats}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          {vehicle.transmission === 'automatic' ? 'Auto' : 'Man'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vehicle.city}
                        </span>
                      </div>

                      {/* Équipements (max 3) */}
                      {vehicle.equipment && vehicle.equipment.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {vehicle.equipment.slice(0, 3).map((eq, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] py-0 px-1.5">
                              {eq.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Prix */}
                      <div className="pt-2 border-t">
                        {vehicle.driver_available && vehicle.with_driver_daily_rate > 0 && vehicle.without_driver_daily_rate > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-muted-foreground">Sans chauffeur</span>
                              <span className="font-bold text-sm">
                                {calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id).toLocaleString()} <span className="text-xs">CDF/j</span>
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-muted-foreground">Avec chauffeur</span>
                              <span className="font-bold text-sm text-primary">
                                {calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id).toLocaleString()} <span className="text-xs">CDF/j</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Par jour</span>
                            <span className="font-bold text-lg text-primary">
                              {calculateCityPrice(dailyRate, vehicle.category_id).toLocaleString()} <span className="text-sm">CDF</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bouton réservation */}
                      <Button className="w-full" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Réserver
                      </Button>
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
