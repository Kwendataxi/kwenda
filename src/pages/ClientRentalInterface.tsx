import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, MapPin, Clock, DollarSign, Star, Calendar, Users, Fuel, Cog } from 'lucide-react';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useNavigate } from 'react-router-dom';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredVehicles = selectedCategory 
    ? getVehiclesByCategory(selectedCategory)
    : vehicles;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
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
                      <div className="absolute top-2 right-2">
                        <Badge variant="default" className="bg-background/80 backdrop-blur">
                          {vehicle.comfort_level}
                        </Badge>
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
    </div>
  );
};

export default ClientRentalInterface;
