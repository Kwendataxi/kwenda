import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Car,
  Truck,
  Crown,
  Leaf,
  Clock,
  Users,
  Fuel,
  Settings,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FluidRentalInterfaceProps {
  onCancel: () => void;
  onBookingComplete: (booking: any) => void;
}

const FluidRentalInterface = ({ onCancel, onBookingComplete }: FluidRentalInterfaceProps) => {
  const [selectedCity, setSelectedCity] = useState<string>('Kinshasa');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [step, setStep] = useState<'selection' | 'booking'>('selection');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 86400000));
  const [pickupLocation, setPickupLocation] = useState('');

  const { 
    categories, 
    vehicles, 
    availableCities,
    calculateCityPrice,
    getVehiclesByCategory,
    createBooking 
  } = useModernRentals(selectedCity);

  const { toast } = useToast();

  const getIconComponent = (iconName: string, className?: string) => {
    const iconMap: { [key: string]: any } = {
      'Car': Car,
      'Truck': Truck,
      'Crown': Crown,
      'Eco': Leaf,
    };
    const IconComponent = iconMap[iconName] || Car;
    return <IconComponent className={className || "w-5 h-5"} />;
  };

  const calculateTotal = () => {
    if (!selectedVehicle || !startDate || !endDate) return 0;
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = calculateCityPrice(selectedVehicle.daily_rate, selectedCategory);
    return basePrice * Math.max(1, days);
  };

  const handleQuickBooking = async () => {
    if (!selectedVehicle || !startDate || !endDate || !pickupLocation) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive'
      });
      return;
    }

    try {
      const bookingData = {
        vehicle_id: selectedVehicle.id,
        rental_duration_type: 'daily' as const,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        pickup_location: pickupLocation,
        return_location: pickupLocation,
        total_amount: calculateTotal(),
        security_deposit: selectedVehicle.security_deposit,
      };

      const result = await createBooking.mutateAsync(bookingData);
      
      onBookingComplete({
        bookingId: result.id,
        vehicle: selectedVehicle,
        totalPrice: calculateTotal(),
        startDate,
        endDate,
        city: selectedCity
      });

      toast({
        title: 'Réservation confirmée !',
        description: 'Votre véhicule vous attend',
      });
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la réservation',
        variant: 'destructive'
      });
    }
  };

  if (step === 'booking' && selectedVehicle) {
    return (
      <div className="min-h-screen bg-background/50 backdrop-blur-sm p-3">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setStep('selection')}
              className="w-10 h-10 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Finaliser la réservation</h1>
              <p className="text-sm text-muted-foreground">Plus qu'une étape</p>
            </div>
          </div>

          {/* Véhicule sélectionné */}
          <Card className="rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                  {getIconComponent(selectedVehicle.vehicle_type === 'utility' ? 'Truck' : 'Car', "w-6 h-6 text-white")}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedVehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.brand} {selectedVehicle.model}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {selectedVehicle.seats}
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3 h-3" />
                      {selectedVehicle.fuel_type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{calculateTotal().toLocaleString()} FC</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-xl border-0 shadow-sm bg-white/80">
              <CardContent className="p-3">
                <label className="text-xs font-medium text-muted-foreground">Début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-0 h-auto mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="font-medium">
                        {startDate ? format(startDate, 'dd MMM', { locale: fr }) : 'Date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm bg-white/80">
              <CardContent className="p-3">
                <label className="text-xs font-medium text-muted-foreground">Fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-0 h-auto mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="font-medium">
                        {endDate ? format(endDate, 'dd MMM', { locale: fr }) : 'Date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date())}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>

          {/* Lieu de prise en charge */}
          <Card className="rounded-xl border-0 shadow-sm bg-white/80">
            <CardContent className="p-3">
              <label className="text-xs font-medium text-muted-foreground">Lieu de prise en charge</label>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Adresse ou point de repère"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bouton de réservation */}
          <Button 
            onClick={handleQuickBooking}
            disabled={createBooking.isPending || !pickupLocation}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {createBooking.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirmation...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Confirmer la réservation
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 backdrop-blur-sm p-3">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCancel}
              className="w-10 h-10 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Location de véhicules</h1>
              <p className="text-sm text-muted-foreground">Choisissez votre véhicule</p>
            </div>
          </div>

          {/* Sélecteur de ville */}
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-white/80 backdrop-blur-sm border-0 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Catégories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className="rounded-full flex-shrink-0"
          >
            Tous
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="rounded-full flex-shrink-0 flex items-center gap-2"
            >
              {getIconComponent(category.icon, "w-4 h-4")}
              {category.name}
            </Button>
          ))}
        </div>

        {/* Véhicules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(selectedCategory ? getVehiclesByCategory(selectedCategory) : vehicles).map((vehicle) => {
            const adjustedPrice = calculateCityPrice(vehicle.daily_rate, selectedCategory);
            
            return (
              <Card 
                key={vehicle.id}
                className="group cursor-pointer rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all hover:scale-[1.02]"
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setStep('booking');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center flex-shrink-0">
                      {getIconComponent(vehicle.vehicle_type === 'utility' ? 'Truck' : 'Car', "w-7 h-7 text-white")}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{vehicle.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{vehicle.brand} {vehicle.model}</p>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {vehicle.seats}
                            </span>
                            <span className="flex items-center gap-1">
                              <Fuel className="w-3 h-3" />
                              {vehicle.fuel_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Settings className="w-3 h-3" />
                              {vehicle.transmission}
                            </span>
                          </div>

                          {vehicle.features.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {vehicle.features.slice(0, 2).map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                                  {feature}
                                </Badge>
                              ))}
                              {vehicle.features.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  +{vehicle.features.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-lg font-bold text-primary">{adjustedPrice.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">FC/jour</p>
                          {vehicle.comfort_level === 'luxury' && (
                            <Crown className="w-4 h-4 text-amber-500 ml-auto mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-muted/50">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>4.8</span>
                    </div>
                    
                    <Button size="sm" className="rounded-full h-8 px-4 bg-gradient-to-r from-primary to-primary-glow">
                      Réserver
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun véhicule disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FluidRentalInterface;