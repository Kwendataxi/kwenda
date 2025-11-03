import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, ArrowLeft, ArrowRight, 
  Check, User, Phone, Mail, CreditCard, Shield, Clock, 
  MapPin, Car, Users, Settings, Star
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { fr } from 'date-fns/locale';

type BookingStep = 'dates' | 'driver-choice' | 'vehicle-equipment' | 'driver-info' | 'summary';

export const ModernRentalBooking = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, vehicleEquipment, driverEquipment, calculateCityPrice, createBooking, getEquipmentPrice } = useModernRentals();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [driverChoice, setDriverChoice] = useState<'with_driver' | 'without_driver' | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [driverInfo, setDriverInfo] = useState({
    name: '',
    phone: '',
    email: '',
    license: ''
  });

  const vehicle = vehicles.find(v => v.id === vehicleId);

  // Auto-select driver choice based on vehicle properties
  useEffect(() => {
    if (vehicle) {
      if (vehicle.driver_required) {
        setDriverChoice('with_driver');
      } else if (!vehicle.driver_available) {
        setDriverChoice('without_driver');
      }
    }
  }, [vehicle]);

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

  const formatCDF = (amount: number): string => {
    return `${amount.toLocaleString('fr-CD')} CDF`;
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !driverChoice) return 0;
    
    const hours = differenceInHours(endDate, startDate);
    const days = Math.max(1, differenceInDays(endDate, startDate));
    
    // Get rates based on driver choice
    const rates = driverChoice === 'with_driver' 
      ? {
          hourly: vehicle.with_driver_hourly_rate || vehicle.hourly_rate,
          daily: vehicle.with_driver_daily_rate || vehicle.daily_rate,
          weekly: vehicle.with_driver_weekly_rate || vehicle.weekly_rate
        }
      : {
          hourly: vehicle.without_driver_hourly_rate || vehicle.hourly_rate,
          daily: vehicle.without_driver_daily_rate || vehicle.daily_rate,
          weekly: vehicle.without_driver_weekly_rate || vehicle.weekly_rate
        };
    
    // Calculate base price
    let basePrice = 0;
    if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      basePrice = (weeks * calculateCityPrice(rates.weekly, vehicle.category_id)) + 
                  (remainingDays * calculateCityPrice(rates.daily, vehicle.category_id));
    } else if (days >= 1) {
      basePrice = days * calculateCityPrice(rates.daily, vehicle.category_id);
    } else {
      basePrice = hours * calculateCityPrice(rates.hourly, vehicle.category_id);
    }

    // Calculate equipment fees
    const equipmentFees = selectedEquipment.reduce((total, eqId) => {
      const price = getEquipmentPrice(eqId, vehicle.city);
      return total + (price * days);
    }, 0);
    
    return basePrice + equipmentFees;
  };

  const getSteps = (): BookingStep[] => {
    const steps: BookingStep[] = ['dates'];
    
    // Add driver choice step only if user has a choice
    if (vehicle.driver_available && !vehicle.driver_required) {
      steps.push('driver-choice');
    }
    
    steps.push('vehicle-equipment');
    
    // Add driver info step only if without driver
    if (driverChoice === 'without_driver') {
      steps.push('driver-info');
    }
    
    steps.push('summary');
    return steps;
  };

  const handleNext = () => {
    const steps = getSteps();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps = getSteps();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      const equipmentTotal = selectedEquipment.reduce((total, eqId) => {
        const price = getEquipmentPrice(eqId, vehicle.city);
        const days = Math.max(1, differenceInDays(endDate!, startDate!));
        return total + (price * days);
      }, 0);

      await createBooking.mutateAsync({
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
        driver_choice: driverChoice,
        equipment_ids: selectedEquipment,
        equipment_total: equipmentTotal,
        driver_name: driverChoice === 'without_driver' ? driverInfo.name : null,
        driver_phone: driverChoice === 'without_driver' ? driverInfo.phone : null,
        driver_email: driverChoice === 'without_driver' ? driverInfo.email : null,
        driver_license: driverChoice === 'without_driver' ? driverInfo.license : null,
        total_price: calculateTotal(),
        security_deposit: calculateCityPrice(vehicle.security_deposit, vehicle.category_id)
      });

      toast({
        title: "Réservation confirmée !",
        description: "Votre demande de location a été enregistrée avec succès"
      });

      navigate('/rental/bookings');
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la réservation",
        variant: "destructive"
      });
    }
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

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
          <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Dates */}
          {currentStep === 'dates' && (
            <motion.div key="dates" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Sélectionnez vos dates
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choisissez la période de location pour {vehicle.name}
                  </p>
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Durée</p>
                          <p className="text-lg font-bold">{Math.max(1, differenceInDays(endDate, startDate))} jour(s)</p>
                        </div>
                        {driverChoice && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Prix estimé</p>
                            <p className="text-2xl font-bold text-primary">{formatCDF(calculateTotal())}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
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

          {/* Step 2: Driver Choice */}
          {currentStep === 'driver-choice' && (
            <motion.div key="driver-choice" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Type de location
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choisissez votre mode de location
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Option SANS chauffeur */}
                  {!vehicle.driver_required && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDriverChoice('without_driver')}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        driverChoice === 'without_driver'
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              driverChoice === 'without_driver' 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {driverChoice === 'without_driver' && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <h3 className="font-bold text-lg">Sans chauffeur</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 ml-9">
                            Conduisez vous-même le véhicule. Permis de conduire requis.
                          </p>
                          <div className="space-y-2 ml-9">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tarif journalier</span>
                              <span className="font-bold text-primary">
                                {formatCDF(calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Tarif hebdomadaire</span>
                              <span className="font-semibold">
                                {formatCDF(calculateCityPrice(vehicle.without_driver_weekly_rate, vehicle.category_id))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Option AVEC chauffeur */}
                  {vehicle.driver_available && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDriverChoice('with_driver')}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        driverChoice === 'with_driver'
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              driverChoice === 'with_driver' 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {driverChoice === 'with_driver' && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <h3 className="font-bold text-lg">Avec chauffeur</h3>
                            {vehicle.driver_required && (
                              <Badge variant="secondary" className="ml-2">Obligatoire</Badge>
                            )}
                            {!vehicle.driver_required && (
                              <Badge variant="secondary" className="ml-2">Recommandé</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 ml-9">
                            Chauffeur professionnel avec licence valide. Confort maximal.
                          </p>
                          <div className="space-y-2 ml-9">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tarif journalier</span>
                              <span className="font-bold text-primary">
                                {formatCDF(calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Tarif hebdomadaire</span>
                              <span className="font-semibold">
                                {formatCDF(calculateCityPrice(vehicle.with_driver_weekly_rate, vehicle.category_id))}
                              </span>
                            </div>
                          </div>

                          {driverEquipment.length > 0 && (
                            <div className="mt-4 pt-4 border-t ml-9">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Équipements chauffeur inclus :
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {driverEquipment.slice(0, 3).map(eq => (
                                  <Badge key={eq.id} variant="outline" className="text-xs">
                                    {eq.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={handleNext}
                    disabled={!driverChoice}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Vehicle Equipment */}
          {currentStep === 'vehicle-equipment' && (
            <motion.div key="vehicle-equipment" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Équipements additionnels
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sélectionnez les équipements souhaités (optionnel)
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {vehicleEquipment.map((eq) => {
                      const price = getEquipmentPrice(eq.id, vehicle.city);
                      return (
                        <motion.div
                          key={eq.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            setSelectedEquipment(prev =>
                              prev.includes(eq.id) 
                                ? prev.filter(e => e !== eq.id) 
                                : [...prev, eq.id]
                            );
                          }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedEquipment.includes(eq.id)
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                selectedEquipment.includes(eq.id) 
                                  ? 'bg-primary border-primary' 
                                  : 'border-muted-foreground'
                              }`}>
                                {selectedEquipment.includes(eq.id) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{eq.name}</p>
                                  {eq.is_premium && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{eq.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{formatCDF(price)}</p>
                              <p className="text-xs text-muted-foreground">par jour</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {selectedEquipment.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Aucun équipement sélectionné</p>
                      <p className="text-xs mt-1">Vous pouvez continuer sans équipement</p>
                    </div>
                  )}

                  {selectedEquipment.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total équipements</span>
                        <span className="font-bold text-primary">
                          {formatCDF(selectedEquipment.reduce((total, eqId) => {
                            const price = getEquipmentPrice(eqId, vehicle.city);
                            const days = Math.max(1, differenceInDays(endDate!, startDate!));
                            return total + (price * days);
                          }, 0))}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={handleNext}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Driver Info (only if without driver) */}
          {currentStep === 'driver-info' && (
            <motion.div key="driver-info" {...fadeInUp}>
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informations conducteur
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Renseignez vos informations pour conduire le véhicule
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={driverInfo.name}
                        onChange={(e) => setDriverInfo({ ...driverInfo, name: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Jean Kabongo"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={driverInfo.phone}
                        onChange={(e) => setDriverInfo({ ...driverInfo, phone: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="+243 800 000 000"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={driverInfo.email}
                        onChange={(e) => setDriverInfo({ ...driverInfo, email: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="jean@example.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Permis de conduire
                      </label>
                      <input
                        type="text"
                        value={driverInfo.license}
                        onChange={(e) => setDriverInfo({ ...driverInfo, license: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Numéro de permis"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
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

          {/* Step 5: Summary */}
          {currentStep === 'summary' && (
            <motion.div key="summary" {...fadeInUp} className="space-y-4">
              <Card className="glassmorphism border-primary/20">
                <CardHeader>
                  <CardTitle>Récapitulatif de la réservation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vehicle */}
                  <div className="flex gap-4">
                    {vehicle.images[0] && (
                      <img 
                        src={vehicle.images[0]} 
                        alt={vehicle.name} 
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} • {vehicle.year}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {driverChoice === 'with_driver' ? 'Avec chauffeur' : 'Sans chauffeur'}
                      </Badge>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Période de location</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span>
                        {format(startDate!, 'dd MMMM yyyy', { locale: fr })} → {format(endDate!, 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.max(1, differenceInDays(endDate!, startDate!))} jour(s)
                    </p>
                  </div>

                  {/* Equipment */}
                  {selectedEquipment.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Équipements sélectionnés</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEquipment.map(eqId => {
                          const eq = vehicleEquipment.find(e => e.id === eqId);
                          return eq ? (
                            <Badge key={eqId} variant="secondary">{eq.name}</Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Driver Info */}
                  {driverChoice === 'without_driver' && driverInfo.name && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Conducteur</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Nom :</span> {driverInfo.name}</p>
                        <p><span className="text-muted-foreground">Téléphone :</span> {driverInfo.phone}</p>
                        {driverInfo.email && (
                          <p><span className="text-muted-foreground">Email :</span> {driverInfo.email}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Location ({driverChoice === 'with_driver' ? 'avec chauffeur' : 'sans chauffeur'})</span>
                      <span className="font-medium">
                        {formatCDF(calculateTotal() - selectedEquipment.reduce((total, eqId) => {
                          const price = getEquipmentPrice(eqId, vehicle.city);
                          const days = Math.max(1, differenceInDays(endDate!, startDate!));
                          return total + (price * days);
                        }, 0))}
                      </span>
                    </div>
                    
                    {selectedEquipment.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Équipements ({selectedEquipment.length})</span>
                        <span className="font-medium">
                          {formatCDF(selectedEquipment.reduce((total, eqId) => {
                            const price = getEquipmentPrice(eqId, vehicle.city);
                            const days = Math.max(1, differenceInDays(endDate!, startDate!));
                            return total + (price * days);
                          }, 0))}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span>Dépôt de garantie</span>
                      <span className="font-medium">
                        {formatCDF(calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total à payer</span>
                      <span className="text-primary">
                        {formatCDF(calculateTotal() + calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Protection et garanties</p>
                        <ul className="text-muted-foreground space-y-0.5 text-xs">
                          <li>• Assurance tous risques incluse</li>
                          <li>• Dépôt de garantie remboursable</li>
                          <li>• Assistance 24/7</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 text-lg py-6"
                    onClick={handleConfirmBooking}
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Confirmation en cours...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Confirmer la réservation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModernRentalBooking;
