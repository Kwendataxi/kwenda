import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModernRentals } from '@/hooks/useModernRentals';
import { usePartnerRentalGroups } from '@/hooks/usePartnerRentalGroups';
import { useRentalBookings } from '@/hooks/useRentalBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Car, Calendar } from 'lucide-react';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';
import { ModernRentalHeader } from '@/components/rental/ModernRentalHeader';
import { ModernRentalNavigationV2 } from '@/components/rental/ModernRentalNavigationV2';
import { PremiumPartnersCarousel } from '@/components/rental/PremiumPartnersCarousel';
import { ModernPartnerCard } from '@/components/rental/ModernPartnerCard';
import { ModernVehicleCard } from '@/components/rental/ModernVehicleCard';
import { MyRentalCard } from '@/components/rental/MyRentalCard';
import { toast } from 'sonner';

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
  const { getUserRentalBookings, cancelRentalBooking } = useRentalBookings();

  const [viewMode, setViewMode] = useState<'partners' | 'vehicles' | 'promos' | 'my-rentals'>('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [myRentals, setMyRentals] = useState<any[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);

  // Charger les locations de l'utilisateur
  useEffect(() => {
    if (viewMode === 'my-rentals') {
      loadMyRentals();
    }
  }, [viewMode]);

  const loadMyRentals = async () => {
    setRentalsLoading(true);
    const bookings = await getUserRentalBookings();
    setMyRentals(bookings);
    setRentalsLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?');
    if (!confirmed) return;

    const success = await cancelRentalBooking(bookingId);
    if (success) {
      await loadMyRentals();
      toast.success('Réservation annulée avec succès');
    }
  };

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
      <PremiumPartnersCarousel 
        premiumPartners={premiumPartners.filter(p => p.tier === 'gold' || p.tier === 'platinum')} 
      />

      {/* Navigation unifiée moderne V2 avec animations */}
      <ModernRentalNavigationV2
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        partnersCount={partnerGroups.length}
        vehiclesCount={vehicles.length}
        promosCount={0}
        myRentalsCount={myRentals.length}
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
        ) : viewMode === 'my-rentals' ? (
          /* My Rentals Tab */
          rentalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-20 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myRentals.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Aucune location</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas encore de réservation. Explorez nos véhicules disponibles !
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRentals.map((booking) => (
                <MyRentalCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
                />
              ))}
            </div>
          )
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
