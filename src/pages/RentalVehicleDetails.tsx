import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useModernRentals } from '@/hooks/useModernRentals';
import { usePartnerRentalGroups } from '@/hooks/usePartnerRentalGroups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VehicleImageGallery } from '@/components/rental/VehicleImageGallery';
import { VehicleSpecifications } from '@/components/rental/VehicleSpecifications';
import { VehicleHeader } from '@/components/rental/VehicleHeader';
import { PricingCard } from '@/components/rental/PricingCard';
import { VehicleReviews } from '@/components/rental/VehicleReviews';
import { SimilarVehicles } from '@/components/rental/SimilarVehicles';
import { 
  Calendar, 
  Shield, 
  User, 
  Car,
  Clock,
  CalendarDays,
  DollarSign,
  FileText,
  XCircle,
  CheckCircle2,
  ChevronRight,
  Star,
  MapPin
} from 'lucide-react';
import { getVehicleImage } from '@/utils/vehicleFallbackImages';
import { formatCurrency, formatCDF } from '@/utils/formatCurrency';

export const RentalVehicleDetails = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { vehicles, calculateCityPrice, isLoading } = useModernRentals();
  const { partnerGroups } = usePartnerRentalGroups();
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowFooter(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const vehicle = vehicles.find(v => v.id === vehicleId);
  const partnerGroup = partnerGroups.find(p => p.partnerId === vehicle?.partner_id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Véhicule non trouvé</h3>
          <Button onClick={() => navigate('/rental')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  // formatCDF déjà importé de utils/formatCurrency

  const vehicleImages = vehicle.images?.length > 0 
    ? vehicle.images 
    : [
        getVehicleImage(vehicle),
        `https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop`,
        `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop`,
        `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop`,
      ];

  const conditions = [
    "Permis de conduire valide requis (si location sans chauffeur)",
    "Carte d'identité ou passeport obligatoire",
    "Âge minimum : 23 ans pour la location",
    "Inspection complète du véhicule avant et après location",
    "Restitution avec le même niveau de carburant",
    "Respect du kilométrage convenu dans le contrat"
  ];

  const minPrice = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
    ? vehicle.without_driver_daily_rate
    : vehicle.with_driver_daily_rate > 0
    ? vehicle.with_driver_daily_rate
    : vehicle.daily_rate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header compact moderne */}
      <VehicleHeader 
        vehicleName={vehicle.name} 
        minPrice={formatCDF(calculateCityPrice(minPrice, vehicle.category_id))}
        showPriceOnScroll
      />

      <div className="max-w-5xl mx-auto pb-24 sm:pb-6">
        {/* Galerie photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-4 sm:px-6 py-4 sm:py-6"
        >
          <VehicleImageGallery images={vehicleImages} vehicleName={vehicle.name} />
        </motion.div>

        <div className="px-4 sm:px-6 space-y-4 sm:space-y-6">
          {/* Informations principales - Card Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-2">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Row 1: Title + Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold mb-2 line-clamp-2">
                        {vehicle.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} · {vehicle.year}
                      </p>
                    </div>
                    
                    <Badge className="bg-green-500 text-white shrink-0">
                      Disponible
                    </Badge>
                  </div>

                  {/* Badges inline */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {vehicle.comfort_level}
                    </Badge>
                    {vehicle.driver_available && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Chauffeur dispo
                      </Badge>
                    )}
                    {vehicle.driver_required && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                        Chauffeur obligatoire
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Row 2: Partner Info */}
                  {partnerGroup && (
                    <div 
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/rental/partner/${vehicle.partner_id}/shop`)}
                    >
                      <img 
                        src={partnerGroup.partnerAvatar || '/placeholder.svg'}
                        alt={partnerGroup.partnerName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">{partnerGroup.partnerName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {partnerGroup.avgRating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span>{partnerGroup.vehicleCount} véhicules</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Spécifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <VehicleSpecifications vehicle={vehicle} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Tarifs avec Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Tarifs de location
                </h3>

                {vehicle.driver_available ? (
                  <Tabs 
                    defaultValue={vehicle.driver_required ? "with" : "without"}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger 
                        value="with" 
                        disabled={!vehicle.driver_available}
                        className="text-xs sm:text-sm"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Avec chauffeur
                      </TabsTrigger>
                      <TabsTrigger 
                        value="without" 
                        disabled={vehicle.driver_required}
                        className="text-xs sm:text-sm"
                      >
                        <Car className="h-4 w-4 mr-2" />
                        Sans chauffeur
                      </TabsTrigger>
                    </TabsList>

                    {/* Avec chauffeur */}
                    <TabsContent value="with" className="space-y-3 mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <PricingCard
                          label="Horaire"
                          price={formatCDF(calculateCityPrice(vehicle.with_driver_hourly_rate, vehicle.category_id))}
                          period="/heure"
                          icon={Clock}
                          index={0}
                        />
                        <PricingCard
                          label="Journalier"
                          price={formatCDF(calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id))}
                          period="/jour"
                          icon={Calendar}
                          featured
                          index={1}
                        />
                        <PricingCard
                          label="Hebdomadaire"
                          price={formatCDF(calculateCityPrice(vehicle.with_driver_weekly_rate, vehicle.category_id))}
                          period="/semaine"
                          icon={CalendarDays}
                          discount="-15%"
                          index={2}
                        />
                      </div>
                    </TabsContent>

                    {/* Sans chauffeur */}
                    {!vehicle.driver_required && (
                      <TabsContent value="without" className="space-y-3 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <PricingCard
                            label="Horaire"
                            price={formatCDF(calculateCityPrice(vehicle.without_driver_hourly_rate, vehicle.category_id))}
                            period="/heure"
                            icon={Clock}
                            index={0}
                          />
                          <PricingCard
                            label="Journalier"
                            price={formatCDF(calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id))}
                            period="/jour"
                            icon={Calendar}
                            featured
                            index={1}
                          />
                          <PricingCard
                            label="Hebdomadaire"
                            price={formatCDF(calculateCityPrice(vehicle.without_driver_weekly_rate, vehicle.category_id))}
                            period="/semaine"
                            icon={CalendarDays}
                            discount="-15%"
                            index={2}
                          />
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <PricingCard
                      label="Horaire"
                      price={formatCDF(calculateCityPrice(vehicle.hourly_rate, vehicle.category_id))}
                      period="/heure"
                      icon={Clock}
                      index={0}
                    />
                    <PricingCard
                      label="Journalier"
                      price={formatCDF(calculateCityPrice(vehicle.daily_rate, vehicle.category_id))}
                      period="/jour"
                      icon={Calendar}
                      featured
                      index={1}
                    />
                    <PricingCard
                      label="Hebdomadaire"
                      price={formatCDF(calculateCityPrice(vehicle.weekly_rate, vehicle.category_id))}
                      period="/semaine"
                      icon={CalendarDays}
                      discount="-15%"
                      index={2}
                    />
                  </div>
                )}

                {/* Dépôt de garantie - Compact */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Dépôt de garantie</p>
                    <p className="text-xs text-muted-foreground">Remboursable en fin de location</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-amber-600 shrink-0">
                    {formatCDF(calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Conditions et informations - Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <Accordion type="single" collapsible defaultValue="conditions">
                  {/* Conditions */}
                  <AccordionItem value="conditions">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm sm:text-base">Conditions de location</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      <div className="space-y-3">
                        {conditions.map((condition, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">{condition}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Assurance incluse */}
                  <AccordionItem value="insurance">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm sm:text-base">Assurance et protection</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground pt-2">
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Assurance tous risques incluse
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Protection contre le vol et les dommages
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Assistance routière 24/7
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Politique d'annulation */}
                  <AccordionItem value="cancellation">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm sm:text-base">Politique d'annulation</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground pt-2">
                        <p>• Annulation gratuite jusqu'à 48h avant la réservation</p>
                        <p>• 50% remboursé entre 24h-48h avant la date de début</p>
                        <p>• Non remboursable moins de 24h avant la date de début</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <VehicleReviews vehicleId={vehicle.id} />
          </motion.div>

          {/* Véhicules similaires */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <SimilarVehicles 
              currentVehicleId={vehicle.id}
              categoryId={vehicle.category_id}
              city={vehicle.city}
            />
          </motion.div>
        </div>
      </div>

      {/* CTA Réservation - Footer fixe avec animation progressive */}
      <AnimatePresence>
        {showFooter && (
          <>
            {/* Footer Desktop */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:block fixed bottom-0 left-0 right-0 z-40"
            >
              <div className="max-w-5xl mx-auto px-6 pb-6">
                <Card className="border-2 border-destructive/30 shadow-2xl overflow-hidden">
                  {/* Header avec badges de confiance */}
                  <div className="bg-gradient-to-r from-destructive/10 to-transparent px-6 py-2 border-b">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs bg-destructive text-white">
                        ⚡ Réservation instantanée
                      </Badge>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Annulation gratuite 48h
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3 text-primary" />
                        Paiement sécurisé
                      </span>
                    </div>
                  </div>
                  
                  {/* Contenu principal */}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-8">
                      {/* Prix avec détails */}
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">Tarif journalier</p>
                        <div className="flex items-baseline gap-3">
                          <p className="text-4xl font-bold text-destructive">
                            {formatCDF(calculateCityPrice(minPrice, vehicle.category_id))}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">/jour</p>
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                              -15% sur une semaine
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* CTA avec sous-texte */}
                      <div className="text-right">
                        <Button 
                          size="lg" 
                          className="h-14 px-10 bg-destructive hover:bg-destructive/90 text-base font-bold shadow-xl"
                          onClick={() => navigate(`/rental-booking/${vehicle.id}`)}
                        >
                          <Calendar className="h-5 w-5 mr-3" />
                          Réserver maintenant
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Confirmation immédiate par SMS
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Footer Mobile */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="bg-background border-t-2 border-destructive/20 shadow-2xl p-4 pb-safe">
                {/* Header du footer avec badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Disponible maintenant
                    </span>
                  </div>
                  <Badge className="bg-destructive text-white text-xs">
                    Réservation instantanée
                  </Badge>
                </div>
                
                {/* Prix et CTA */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">À partir de</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-destructive">
                        {formatCDF(calculateCityPrice(minPrice, vehicle.category_id)).split(' ')[0]}
                      </p>
                      <span className="text-sm font-bold text-destructive">CDF</span>
                      <span className="text-xs text-muted-foreground">/jour</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="h-14 px-6 bg-destructive hover:bg-destructive/90 shadow-lg"
                    onClick={() => navigate(`/rental-booking/${vehicle.id}`)}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-bold">Réserver</span>
                  </Button>
                </div>
                
                {/* Trust badge */}
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Annulation gratuite 48h avant</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer adaptatif pour éviter que le contenu soit caché */}
      <div className="h-32 lg:h-0" />
    </div>
  );
};

export default RentalVehicleDetails;
