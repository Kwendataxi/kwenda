import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModernRentals } from '@/hooks/useModernRentals';
import { usePartnerRentalGroups } from '@/hooks/usePartnerRentalGroups';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Car } from 'lucide-react';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';
import { ModernRentalHeader } from '@/components/rental/ModernRentalHeader';
import { ModernRentalNavigation } from '@/components/rental/ModernRentalNavigation';
import { PremiumPartnersCarousel } from '@/components/rental/PremiumPartnersCarousel';
import { ModernPartnerCard } from '@/components/rental/ModernPartnerCard';
import { ModernVehicleCard } from '@/components/rental/ModernVehicleCard';

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

  const [viewMode, setViewMode] = useState<'partners' | 'vehicles' | 'promos'>('partners');
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

  // Filtrage des véhicules et partenaires
  const { filteredVehicles, filteredPartners } = useMemo(() => {
    const filteredVehs = vehicles.filter((v) => {
      const matchesSearch = !searchTerm || 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || v.category_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    const filteredParts = partnerGroups.filter((p) => {
      if (!searchTerm) return true;
      return p.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return { filteredVehicles: filteredVehs, filteredPartners: filteredParts };
  }, [vehicles, partnerGroups, searchTerm, selectedCategory]);

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

      {/* Header moderne compact */}
      <ModernRentalHeader
        userLocation={userLocation}
        setUserLocation={setUserLocation}
        availableCities={availableCities}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Premium Partners Carousel conditionnel */}
      <PremiumPartnersCarousel premiumPartners={premiumPartners} />

      {/* Navigation unifiée moderne */}
      <ModernRentalNavigation
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        partnersCount={partnerGroups.length}
        vehiclesCount={vehicles.length}
        promosCount={0}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        vehicleCounts={vehicleCountsMap}
      />

      {/* Content based on view mode */}
      <div className="max-w-7xl mx-auto px-4 pb-6 pt-6">
        {viewMode === 'partners' ? (
          /* Partners Grid - Moderne */
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
          ) : filteredPartners.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Aucune agence disponible</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? `Aucun résultat pour "${searchTerm}"`
                    : `Aucune agence ne propose de véhicules à ${userLocation} actuellement`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map((partner, index) => (
                <ModernPartnerCard
                  key={partner.partnerId}
                  partnerId={partner.partnerId}
                  partnerName={partner.partnerName}
                  partnerAvatar={partner.partnerAvatar}
                  tier={partner.tier}
                  vehicleCount={partner.vehicleCount}
                  avgRating={partner.avgRating}
                  ratingCount={partner.ratingCount}
                  followersCount={partner.followersCount}
                  topVehicles={partner.topVehicles}
                  index={index}
                />
              ))}
            </div>
          )
        ) : viewMode === 'vehicles' ? (
          /* Vehicles Grid - Moderne */
          <div>
        {filteredVehicles.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mb-4 p-6 bg-muted rounded-full inline-flex">
                <Car className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Aucun véhicule disponible</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? `Aucun résultat pour "${searchTerm}". Essayez une autre recherche.`
                  : `Pas de véhicule disponible à ${userLocation} actuellement.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVehicles.map((vehicle, index) => {
              const vehiclePartner = partnerGroups.find(p => 
                p.vehicles.some(v => v.id === vehicle.id)
              );
              const vehicleCategory = categories.find(cat => cat.id === vehicle.category_id);
              
              return (
                <ModernVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  categoryName={vehicleCategory?.name}
                  partnerName={vehiclePartner?.partnerName}
                  partnerAvatar={vehiclePartner?.partnerAvatar}
                  index={index}
                />
              );
            })}
          </div>
        )}
          </div>
        ) : (
          /* Promos Tab - Coming soon */
          <Card>
            <CardContent className="py-16 text-center">
              <h3 className="text-xl font-bold mb-2">Promotions à venir</h3>
              <p className="text-muted-foreground">Les offres spéciales seront bientôt disponibles</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientRentalInterface;
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
