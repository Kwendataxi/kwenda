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
import { getCategoryTheme } from '@/utils/categoryThemes';

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
  const [viewMode, setViewMode] = useState<'categories' | 'grid'>('categories');

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

      {/* Barre de filtres - Une seule ligne scrollable */}
      <div className="sticky top-[110px] z-40 bg-background/98 backdrop-blur-xl border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-2.5">
          {/* LIGNE UNIQUE - Scroll horizontal */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* Bouton TOUS */}
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="whitespace-nowrap text-xs font-semibold shrink-0"
            >
              🌐 Tous ({vehicles.length})
            </Button>
            
            {/* Filtres de catégories avec scroll */}
            {categories.map((cat) => {
              const count = vehicles.filter(v => v.category_id === cat.id).length;
              const theme = getCategoryTheme(cat.name);
              
              if (count === 0) return null;
              
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    document.getElementById(`category-${cat.id}`)?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start',
                      inline: 'nearest'
                    });
                  }}
                  className={`whitespace-nowrap text-xs font-semibold shrink-0 ${
                    selectedCategory === cat.id 
                      ? `bg-gradient-to-r ${theme.gradient} text-white border-0` 
                      : ''
                  }`}
                >
                  {theme.icon} {cat.name.trim()} ({count})
                </Button>
              );
            })}
            
            {/* Séparateur vertical */}
            <div className="h-8 w-px bg-border shrink-0 mx-1" />
            
            {/* Toggle Vue (toujours visible à droite) */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant={viewMode === 'categories' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('categories')}
                className="text-xs px-3"
              >
                📋 Types
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-xs px-3"
              >
                ⊞ Grille
              </Button>
            </div>
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

      {/* Liste des véhicules */}
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
        ) : viewMode === 'categories' ? (
          // Vue par catégories
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryVehicles = filteredVehicles.filter(v => v.category_id === category.id);
              
              if (categoryVehicles.length === 0) return null;
              
              const theme = getCategoryTheme(category.name);
              
              return (
                <section key={category.id} id={`category-${category.id}`} className="scroll-mt-40">
                  {/* En-tête de catégorie */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-primary/20">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-lg`}>
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>{theme.icon}</span>
                        {category.name}
                        <Badge variant="secondary" className="text-xs">
                          {categoryVehicles.length} véhicule{categoryVehicles.length > 1 ? 's' : ''}
                        </Badge>
                      </h2>
                      <p className="text-sm text-muted-foreground">{theme.description}</p>
                    </div>
                  </div>
                  
                  {/* Grille de véhicules de la catégorie */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {categoryVehicles.map((vehicle, index) => {
                      const dailyRate = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
                        ? vehicle.without_driver_daily_rate
                        : vehicle.daily_rate;
                      
                      const vehicleImage = getVehicleImage(vehicle);
                      const hasRealImage = vehicle.images?.[0] && vehicle.images[0] !== '/placeholder.svg';
                      const hasDriverOption = vehicle.driver_available && vehicle.with_driver_daily_rate > 0;
                      
                      // Récupérer le thème de la catégorie pour le badge
                      const vehicleCategory = categories.find(cat => cat.id === vehicle.category_id);
                      const categoryTheme = vehicleCategory ? getCategoryTheme(vehicleCategory.name) : null;
                      
                      return (
                        <motion.div
                          key={vehicle.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <Card 
                            className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-primary"
                            onClick={() => navigate(`/rental/${vehicle.id}/details`)}
                          >
                            {/* Image */}
                            <div className="relative h-40 overflow-hidden">
                              {hasRealImage ? (
                                <img 
                                  src={vehicleImage} 
                                  alt={vehicle.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className={`flex items-center justify-center h-full bg-gradient-to-br ${getVehicleGradient(vehicle)}`}>
                                  <Car className="h-16 w-16 text-white/50" />
                                </div>
                              )}
                              
                              {/* Badges - Optimisés */}
                              <div className="absolute inset-0">
                                {/* Badge CHAUFFEUR - Haut droite */}
                                <div className="absolute top-2 right-2">
                                  {vehicle.driver_available ? (
                                    <Badge className="bg-green-500 text-white text-xs py-1.5 px-3 font-semibold shadow-lg animate-pulse border-2 border-white/30">
                                      <User className="h-3.5 w-3.5 mr-1" />
                                      Avec chauffeur
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-500/90 backdrop-blur-sm text-white text-xs py-1 px-2.5 font-semibold shadow-lg border border-white/30">
                                      Sans chauffeur
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Badge CONFORT - Bas gauche (optionnel) */}
                                <div className="absolute bottom-2 left-2">
                                  <Badge className="bg-black/60 backdrop-blur-sm text-white text-[10px] py-0.5 px-2">
                                    {vehicle.comfort_level}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-3 space-y-2">
                              {/* Nom */}
                              <div>
                                <h3 className="font-bold text-base leading-tight line-clamp-1">{vehicle.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {vehicle.brand} {vehicle.model} · {vehicle.year}
                                </p>
                              </div>

                              {/* Infos */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <Users className="h-3 w-3" />
                                  {vehicle.seats}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Settings className="h-3 w-3" />
                                  {vehicle.transmission === 'automatic' ? 'Auto' : 'Man'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {vehicle.city}
                                </span>
                              </div>

                              {/* Prix amélioré - Deux tarifs si chauffeur disponible */}
                              <div className="pt-2 border-t space-y-1.5">
                                {hasDriverOption ? (
                                  <>
                                    {/* Tarif sans chauffeur */}
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">Sans chauffeur</span>
                                      <span className="font-bold">
                                        {calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id).toLocaleString()} CDF/j
                                      </span>
                                    </div>
                                    {/* Tarif avec chauffeur - Mis en avant */}
                                    <div className="flex justify-between items-center bg-primary/10 px-2 py-1.5 rounded-md">
                                      <span className="text-xs font-medium flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        Avec chauffeur
                                      </span>
                                      <span className="font-bold text-base text-primary">
                                        {calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id).toLocaleString()} CDF/j
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Tarif journalier</span>
                                    <span className="font-bold text-lg text-primary">
                                      {calculateCityPrice(dailyRate, vehicle.category_id).toLocaleString()} CDF/j
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Bouton CTA */}
                              <Button size="sm" className="w-full mt-2">
                                Voir les détails
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          // Vue grille classique
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredVehicles.map((vehicle, index) => {
              const dailyRate = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
                ? vehicle.without_driver_daily_rate
                : vehicle.daily_rate;
              
              const vehicleImage = getVehicleImage(vehicle);
              const hasRealImage = vehicle.images?.[0] && vehicle.images[0] !== '/placeholder.svg';
              const hasDriverOption = vehicle.driver_available && vehicle.with_driver_daily_rate > 0;
              
              // Récupérer le thème de la catégorie pour le badge
              const vehicleCategory = categories.find(cat => cat.id === vehicle.category_id);
              const categoryTheme = vehicleCategory ? getCategoryTheme(vehicleCategory.name) : null;
              
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-primary"
                    onClick={() => navigate(`/rental/${vehicle.id}/details`)}
                  >
                    <div className="relative h-40 overflow-hidden">
                      {hasRealImage ? (
                        <img 
                          src={vehicleImage} 
                          alt={vehicle.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`flex items-center justify-center h-full bg-gradient-to-br ${getVehicleGradient(vehicle)}`}>
                          <Car className="h-16 w-16 text-white/50" />
                        </div>
                      )}
                      
                      {/* Badges - Optimisés */}
                      <div className="absolute inset-0">
                        {/* Badge CHAUFFEUR - Haut droite */}
                        <div className="absolute top-2 right-2">
                          {vehicle.driver_available ? (
                            <Badge className="bg-green-500 text-white text-xs py-1.5 px-3 font-semibold shadow-lg animate-pulse border-2 border-white/30">
                              <User className="h-3.5 w-3.5 mr-1" />
                              Avec chauffeur
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/90 backdrop-blur-sm text-white text-xs py-1 px-2.5 font-semibold shadow-lg border border-white/30">
                              Sans chauffeur
                            </Badge>
                          )}
                        </div>
                        
                        {/* Badge CONFORT - Bas gauche (optionnel) */}
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-black/60 backdrop-blur-sm text-white text-[10px] py-0.5 px-2">
                            {vehicle.comfort_level}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-3 space-y-2">
                      <div>
                        <h3 className="font-bold text-base leading-tight line-clamp-1">{vehicle.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.brand} {vehicle.model} · {vehicle.year}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {vehicle.seats}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Settings className="h-3 w-3" />
                          {vehicle.transmission === 'automatic' ? 'Auto' : 'Man'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {vehicle.city}
                        </span>
                      </div>

                      <div className="pt-2 border-t space-y-1.5">
                        {hasDriverOption ? (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Sans chauffeur</span>
                              <span className="font-bold">
                                {calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id).toLocaleString()} CDF/j
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-primary/10 px-2 py-1.5 rounded-md">
                              <span className="text-xs font-medium flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Avec chauffeur
                              </span>
                              <span className="font-bold text-base text-primary">
                                {calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id).toLocaleString()} CDF/j
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Tarif journalier</span>
                            <span className="font-bold text-lg text-primary">
                              {calculateCityPrice(dailyRate, vehicle.category_id).toLocaleString()} CDF/j
                            </span>
                          </div>
                        )}
                      </div>

                      <Button size="sm" className="w-full mt-2">
                        Voir les détails
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
