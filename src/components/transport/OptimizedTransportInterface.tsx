import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Clock, MapPin, Star, Users, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import YangoVehicleSelector from './YangoVehicleSelector';

interface OptimizedTransportInterfaceProps {
  onNavigate: (path: string) => void;
}

const VehicleTypeCard = React.memo(({ 
  type, 
  description, 
  price, 
  eta, 
  available, 
  onSelect 
}: {
  type: string;
  description: string;
  price: string;
  eta: string;
  available: number;
  onSelect: () => void;
}) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{type}</h3>
        </div>
        <Badge variant={available > 0 ? "default" : "secondary"}>
          {available} dispo
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {eta}
        </span>
        <span className="font-semibold text-primary">{price}</span>
      </div>
    </CardContent>
  </Card>
));

const QuickLocationCard = React.memo(({ 
  name, 
  subtitle, 
  distance, 
  onSelect 
}: {
  name: string;
  subtitle: string;
  distance?: string;
  onSelect: () => void;
}) => (
  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onSelect}>
    <CardContent className="p-3">
      <div className="flex items-center gap-3">
        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        {distance && (
          <span className="text-xs text-muted-foreground">{distance}</span>
        )}
      </div>
    </CardContent>
  </Card>
));

const OptimizedTransportInterface: React.FC<OptimizedTransportInterfaceProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('book');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Données optimisées avec React Query
  const { data: driverStatus } = useQuery({
    queryKey: ['driver-status'],
    queryFn: async () => {
      const { data } = await supabase
        .from('driver_online_status_table')
        .select('*');
      return data || [];
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30s
  });

  const { data: recentRides } = useQuery({
    queryKey: ['recent-rides'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transport_bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: activeTab === 'history',
  });

  // Données des véhicules optimisées
  const vehicleTypes = useMemo(() => [
    {
      id: 'taxi-bus',
      name: 'Taxi Bus',
      description: 'Transport collectif économique',
      basePrice: '500 CDF',
      eta: '5-10 min',
      available: driverStatus?.find(d => d.vehicle_class === 'taxi-bus')?.online_drivers || 0
    },
    {
      id: 'moto-taxi',
      name: 'Moto Taxi',
      description: 'Rapide et pratique',
      basePrice: '1000 CDF',
      eta: '3-7 min',
      available: driverStatus?.find(d => d.vehicle_class === 'moto-taxi')?.online_drivers || 0
    },
    {
      id: 'vtc',
      name: 'VTC Privé',
      description: 'Confortable et climatisé',
      basePrice: '2500 CDF',
      eta: '8-15 min',
      available: driverStatus?.find(d => d.vehicle_class === 'standard')?.online_drivers || 0
    }
  ], [driverStatus]);

  const quickLocations = useMemo(() => [
    { name: 'Aéroport de Ndjili', subtitle: 'Terminal Principal', distance: '15 km' },
    { name: 'Centre-ville', subtitle: 'Boulevard du 30 Juin', distance: '8 km' },
    { name: 'Université de Kinshasa', subtitle: 'Campus principal', distance: '12 km' },
    { name: 'Marché Central', subtitle: 'Grande Place', distance: '5 km' }
  ], []);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    onNavigate(`/client/transport/book?vehicle=${vehicleId}`);
  }, [onNavigate]);

  const handleLocationSelect = useCallback((location: string) => {
    onNavigate(`/client/transport/book?destination=${encodeURIComponent(location)}`);
  }, [onNavigate]);

  return (
    <div className="space-y-4 md:space-y-6 responsive-padding">
      {/* En-tête avec statut */}
      <Card className="card-modern shadow-soft">
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-responsive-lg">
              <div className="p-1.5 bg-gradient-hero rounded-lg">
                <Car className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              Transport VTC
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <Users className="w-3 h-3" />
              <span className="text-responsive-xs">
                {driverStatus?.reduce((sum, d) => sum + (d.online_drivers || 0), 0) || 0} chauffeurs
              </span>
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-12 md:h-auto">
          <TabsTrigger value="book" className="text-responsive-sm min-touch-target">Réserver</TabsTrigger>
          <TabsTrigger value="history" className="text-responsive-sm min-touch-target">Historique</TabsTrigger>
          <TabsTrigger value="favorites" className="text-responsive-sm min-touch-target">Favoris</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="space-y-4 md:space-y-6 mt-4">
          {/* Yango Vehicle Selector */}
          <YangoVehicleSelector
            distance={5}
            onVehicleSelect={(vehicle) => {
              setSelectedVehicle(vehicle.id);
              onNavigate(`/client/transport/book?vehicle=${vehicle.id}`);
            }}
            selectedVehicleId={selectedVehicle || undefined}
          />

          {/* Destinations rapides */}
          <div>
            <h3 className="text-responsive-lg font-semibold mb-3 md:mb-4">Destinations populaires</h3>
            <div className="grid gap-3">
              {quickLocations.map((location, index) => (
                <QuickLocationCard
                  key={index}
                  name={location.name}
                  subtitle={location.subtitle}
                  distance={location.distance}
                  onSelect={() => handleLocationSelect(location.name)}
                />
              ))}
            </div>
          </div>

          {/* Bouton nouvelle course */}
          <div className="pt-4">
            <Button
              onClick={() => onNavigate('/client/transport/book')}
              className="w-full h-14 text-responsive-lg hover-scale touch-friendly"
              size="lg"
              variant="congo"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle course
            </Button>
          </div>

          {/* Action principale */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => onNavigate('/client/transport/book')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Nouvelle course
          </Button>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {recentRides?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucune course récente</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => setActiveTab('book')}
                >
                  Réserver maintenant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentRides?.map((ride) => (
                <Card key={ride.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{ride.pickup_location}</p>
                        <p className="text-sm text-muted-foreground">→ {ride.destination}</p>
                      </div>
                      <Badge variant={ride.status === 'completed' ? 'default' : 'secondary'}>
                        {ride.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{new Date(ride.created_at).toLocaleDateString()}</span>
                      <span className="font-semibold">{ride.actual_price || ride.estimated_price} CDF</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Vos destinations favorites apparaîtront ici</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizedTransportInterface;