import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useModernRentals } from '@/hooks/useModernRentals';
import { usePartnerRentalGroups } from '@/hooks/usePartnerRentalGroups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PartnerTierBadge } from '@/components/rental/PartnerTierBadge';
import { 
  Search, Car, User, Users, Settings, MapPin, 
  Calendar as CalendarIcon, Building2, Star, Heart
} from 'lucide-react';
import { AutoHideRentalPromoSlider } from '@/components/rental/AutoHideRentalPromoSlider';
import { RentalCategoryBar } from '@/components/rental/RentalCategoryBar';
import { getVehicleImage, getVehicleGradient } from '@/utils/vehicleFallbackImages';
import { getCategoryTheme } from '@/utils/categoryThemes';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';

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

  const { partnerGroups, premiumPartners, isLoading: partnersLoading } = usePartnerRentalGroups(userLocation);

  const [viewMode, setViewMode] = useState<'partners' | 'vehicles'>('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calcul des compteurs de véhicules par catégorie
  const vehicleCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.id] = vehicles.filter(v => v.category_id === cat.id).length;
    });
    
    // ✅ DEBUG LOG
    console.log("📊 [CLIENT_RENTAL] Vehicle counts:", {
      totalCategories: categories.length,
      totalVehicles: vehicles.length,
      counts,
      categories: categories.map(c => ({ id: c.id, name: c.name }))
    });
    
    return counts;
  }, [vehicles, categories]);

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
      {/* Header avec bouton retour */}
      <UniversalAppHeader 
        title="Kwenda Location" 
        showBackButton={true}
        onBackClick={() => navigate('/app/client')}
      />

      {/* Sélecteur de ville + Recherche - sticky sous le header */}
      <div className="sticky top-[60px] z-40 bg-background/98 backdrop-blur-xl border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-3">
          {/* Sélecteur de ville */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">📍 Ville :</span>
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
          
          {/* Recherche */}
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

      {/* Premium Partners Slider */}
      {premiumPartners.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 pt-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">🌟 Partenaires Premium</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {premiumPartners.map(partner => (
                <Card 
                  key={partner.partnerId}
                  className="rental-card-premium min-w-[300px] cursor-pointer"
                  onClick={() => navigate(`/rental/partner/${partner.partnerId}/shop`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={partner.partnerAvatar || '/placeholder.svg'} 
                        alt={partner.partnerName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold line-clamp-1">{partner.partnerName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <PartnerTierBadge tier={partner.tier} className="text-xs" />
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {partner.avgRating > 0 ? partner.avgRating.toFixed(1) : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{partner.vehicleCount} véhicules</span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {partner.followersCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slider publicitaire auto-hide */}
      <div className="max-w-7xl mx-auto px-3 pt-4">
        <AutoHideRentalPromoSlider />
      </div>

      {/* View Mode Toggle */}
      <div className="max-w-7xl mx-auto px-3 pt-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'partners' | 'vehicles')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="partners" className="gap-2">
              <Building2 className="h-4 w-4" />
              Par Agences ({partnerGroups.length})
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2">
              <Car className="h-4 w-4" />
              Tous les Véhicules ({vehicles.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Barre de catégories moderne */}
      <RentalCategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        vehicleCounts={vehicleCountsMap}
        totalVehicles={vehicles.length}
      />

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

      {/* Content based on view mode */}
      <div className="max-w-7xl mx-auto px-3 pb-6 pt-2">
        {viewMode === 'partners' ? (
          /* Partners Grid */
          partnersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : partnerGroups.length === 0 ? (
            <Card className="glassmorphism">
              <CardContent className="py-16 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Aucune agence disponible</h3>
                <p className="text-muted-foreground">
                  Aucune agence ne propose de véhicules à {userLocation} actuellement
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnerGroups.map((partner, index) => (
                <motion.div
                  key={partner.partnerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="rental-card-premium cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/rental/partner/${partner.partnerId}/shop`)}
                  >
                    <CardContent className="p-0">
                      {/* Partner Header */}
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                        <div className="flex items-center gap-3 mb-3">
                          <img 
                            src={partner.partnerAvatar || '/placeholder.svg'}
                            alt={partner.partnerName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg line-clamp-1">{partner.partnerName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <PartnerTierBadge tier={partner.tier} className="text-xs" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <div className="font-bold text-lg">{partner.vehicleCount}</div>
                            <div className="text-xs text-muted-foreground">Véhicules</div>
                          </div>
                          <div>
                            <div className="font-bold text-lg flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              {partner.avgRating > 0 ? partner.avgRating.toFixed(1) : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">{partner.ratingCount} avis</div>
                          </div>
                          <div>
                            <div className="font-bold text-lg flex items-center justify-center gap-1">
                              <Heart className="h-4 w-4" />
                              {partner.followersCount}
                            </div>
                            <div className="text-xs text-muted-foreground">Abonnés</div>
                          </div>
                        </div>
                      </div>

                      {/* Top 3 Vehicles Preview */}
                      <div className="p-4 space-y-2">
                        <div className="text-sm font-semibold mb-2">Aperçu des véhicules</div>
                        {partner.topVehicles.map(vehicle => (
                          <div key={vehicle.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                              {vehicle.images?.[0] ? (
                                <img 
                                  src={vehicle.images[0]} 
                                  alt={vehicle.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${getVehicleGradient(vehicle)} flex items-center justify-center`}>
                                  <Car className="h-6 w-6 text-white/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm line-clamp-1">{vehicle.name}</div>
                              <div className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</div>
                            </div>
                            <div className="text-sm font-bold text-primary">
                              {vehicle.daily_rate.toLocaleString()} FC/j
                            </div>
                          </div>
                        ))}
                        {partner.vehicleCount > 3 && (
                          <div className="text-center text-sm text-muted-foreground pt-2">
                            +{partner.vehicleCount - 3} autres véhicules
                          </div>
                        )}
                      </div>

                      <div className="px-4 pb-4">
                        <Button className="w-full" size="sm">
                          Voir la boutique
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* Vehicles Grid - Original */
          <div>
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
              const hasDriverOption = vehicle.driver_available && vehicle.with_driver_daily_rate > 0;
              
              // Récupérer le thème de la catégorie pour le badge
              const vehicleCategory = categories.find(cat => cat.id === vehicle.category_id);
              const categoryTheme = vehicleCategory ? getCategoryTheme(vehicleCategory.name) : null;
              
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
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
                      
                      {/* Badges */}
                      <div className="absolute inset-0">
                        {/* Badge CATÉGORIE - Haut gauche */}
                        {categoryTheme && vehicleCategory && (
                          <div className="absolute top-2 left-2">
                            <Badge className={`bg-gradient-to-r ${categoryTheme.gradient} text-white text-xs py-1 px-2.5 font-semibold shadow-lg border border-white/20`}>
                              <span className="text-sm mr-1">{categoryTheme.icon}</span>
                              {vehicleCategory.name}
                            </Badge>
                          </div>
                        )}
                        
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
                        
                        {/* Badge CONFORT - Bas gauche */}
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
        )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ClientRentalInterface;
