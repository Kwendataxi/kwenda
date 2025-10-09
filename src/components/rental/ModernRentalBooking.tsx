import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, ArrowLeft, ArrowRight, 
  Check, User, Phone, Mail, MapPin, CreditCard,
  Shield, Clock, Info
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useToast } from '@/hooks/use-toast';
import { addDays, differenceInDays, differenceInHours } from 'date-fns';

type BookingStep = 'dates' | 'addons' | 'driver-info' | 'summary';

export const ModernRentalBooking = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, equipment, calculateCityPrice, createBooking } = useModernRentals();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [driverInfo, setDriverInfo] = useState({
    name: '',
    phone: '',
    email: '',
    license: ''
  });

  const vehicle = vehicles.find(v => v.id === vehicleId);

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Véhicule non trouvé</h3>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    
    const hours = differenceInHours(endDate, startDate);
    const days = differenceInDays(endDate, startDate);
    
    let basePrice = 0;
    if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      basePrice = (weeks * calculateCityPrice(vehicle.weekly_rate, vehicle.category_id)) + 
                  (remainingDays * calculateCityPrice(vehicle.daily_rate, vehicle.category_id));
    } else if (days >= 1) {
      basePrice = days * calculateCityPrice(vehicle.daily_rate, vehicle.category_id);
    } else {
      basePrice = hours * calculateCityPrice(vehicle.hourly_rate, vehicle.category_id);
    }

    // Equipment fees (example: 5000 FC per equipment per day)
    const equipmentFees = selectedEquipment.length * 5000 * Math.max(1, days);
    
    return basePrice + equipmentFees;
  };

  const handleNext = () => {
    const steps: BookingStep[] = ['dates', 'addons', 'driver-info', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: BookingStep[] = ['dates', 'addons', 'driver-info', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      await createBooking.mutateAsync({
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
        equipment: selectedEquipment,
        driver_name: driverInfo.name,
        driver_phone: driverInfo.phone,
        driver_email: driverInfo.email,
        driver_license: driverInfo.license,
        total_price: calculateTotal(),
        security_deposit: calculateCityPrice(vehicle.security_deposit, vehicle.category_id)
      });

      toast({
        title: "Réservation confirmée !",
        description: "Votre demande de location a été enregistrée avec succès"
      });

      navigate('/client');
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  const progressPercentage = {
    'dates': 25,
    'addons': 50,
    'driver-info': 75,
    'summary': 100
  }[currentStep];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-lg">Réservation</h1>
              <p className="text-sm text-muted-foreground">{vehicle.name}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Step 1: Dates */}
        {currentStep === 'dates' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Sélectionnez vos dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date de début</label>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date de fin</label>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => !startDate || date < startDate}
                      className="rounded-lg border"
                    />
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium">
                      Durée : {differenceInDays(endDate, startDate)} jour(s)
                    </p>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {calculateTotal().toLocaleString()} FC
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleNext}
                  disabled={!startDate || !endDate}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Add-ons */}
        {currentStep === 'addons' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Équipements additionnels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {['gps', 'child_seat', 'wifi', 'driver'].map((eq) => (
                    <div
                      key={eq}
                      onClick={() => {
                        setSelectedEquipment(prev =>
                          prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
                        );
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedEquipment.includes(eq)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedEquipment.includes(eq) ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {selectedEquipment.includes(eq) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{eq.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">5,000 FC / jour</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full" onClick={handleNext}>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Driver Info */}
        {currentStep === 'driver-info' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informations conducteur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={driverInfo.name}
                      onChange={(e) => setDriverInfo({ ...driverInfo, name: e.target.value })}
                      className="w-full p-3 border border-border rounded-lg bg-background"
                      placeholder="Jean Kabongo"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={driverInfo.phone}
                      onChange={(e) => setDriverInfo({ ...driverInfo, phone: e.target.value })}
                      className="w-full p-3 border border-border rounded-lg bg-background"
                      placeholder="+243 800 000 000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={driverInfo.email}
                      onChange={(e) => setDriverInfo({ ...driverInfo, email: e.target.value })}
                      className="w-full p-3 border border-border rounded-lg bg-background"
                      placeholder="jean@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Permis de conduire
                    </label>
                    <input
                      type="text"
                      value={driverInfo.license}
                      onChange={(e) => setDriverInfo({ ...driverInfo, license: e.target.value })}
                      className="w-full p-3 border border-border rounded-lg bg-background"
                      placeholder="Numéro de permis"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleNext}
                  disabled={!driverInfo.name || !driverInfo.phone}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Summary */}
        {currentStep === 'summary' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>Récapitulatif de la réservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle */}
                <div className="flex gap-4">
                  {vehicle.images[0] && (
                    <img src={vehicle.images[0]} alt={vehicle.name} className="w-24 h-24 object-cover rounded-lg" />
                  )}
                  <div>
                    <h3 className="font-semibold">{vehicle.name}</h3>
                    <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Dates de location</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {differenceInDays(endDate!, startDate!)} jour(s)
                  </p>
                </div>

                {/* Equipment */}
                {selectedEquipment.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Équipements</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEquipment.map(eq => (
                        <Badge key={eq} variant="secondary">{eq.replace('_', ' ')}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Location</span>
                    <span>{calculateTotal().toLocaleString()} FC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dépôt de garantie</span>
                    <span>{calculateCityPrice(vehicle.security_deposit, vehicle.category_id).toLocaleString()} FC</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">
                      {(calculateTotal() + calculateCityPrice(vehicle.security_deposit, vehicle.category_id)).toLocaleString()} FC
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  onClick={handleConfirmBooking}
                  disabled={createBooking.isPending}
                >
                  {createBooking.isPending ? 'Confirmation...' : 'Confirmer la réservation'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ModernRentalBooking;
