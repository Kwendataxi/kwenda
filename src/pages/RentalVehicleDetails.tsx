import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useModernRentals } from '@/hooks/useModernRentals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VehicleImageGallery } from '@/components/rental/VehicleImageGallery';
import { VehicleSpecifications } from '@/components/rental/VehicleSpecifications';
import { ArrowLeft, Calendar, Shield, User } from 'lucide-react';
import { getVehicleImage } from '@/utils/vehicleFallbackImages';

export const RentalVehicleDetails = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { vehicles, calculateCityPrice, isLoading } = useModernRentals();

  const vehicle = vehicles.find(v => v.id === vehicleId);

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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const formatCDF = (amount: number): string => {
    return `${amount.toLocaleString('fr-CD')} CDF`;
  };

  const vehicleImages = [
    getVehicleImage(vehicle),
    `https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=600&fit=crop`
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-background/98 backdrop-blur-xl border-b shadow-sm">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/rental')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Détails du véhicule</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Galerie photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <VehicleImageGallery images={vehicleImages} vehicleName={vehicle.name} />
        </motion.div>

        {/* Informations principales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{vehicle.comfort_level}</Badge>
                    {vehicle.driver_available && (
                      <Badge className="bg-green-500 text-white">
                        <User className="h-3 w-3 mr-1" />
                        Chauffeur disponible
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{vehicle.name}</h2>
                  <p className="text-muted-foreground">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                </div>
              </div>

              {/* Spécifications */}
              <VehicleSpecifications vehicle={vehicle} />

              {/* Tarifs */}
              <div className="pt-4 border-t space-y-3">
                <h3 className="font-bold text-lg">Tarifs de location</h3>
                
                {vehicle.driver_available && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Avec chauffeur</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Horaire</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCDF(calculateCityPrice(vehicle.with_driver_hourly_rate, vehicle.category_id))}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Journalier</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCDF(calculateCityPrice(vehicle.with_driver_daily_rate, vehicle.category_id))}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Hebdomadaire</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCDF(calculateCityPrice(vehicle.with_driver_weekly_rate, vehicle.category_id))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!vehicle.driver_required && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Sans chauffeur</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Horaire</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCDF(calculateCityPrice(vehicle.without_driver_hourly_rate, vehicle.category_id))}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Journalier</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCDF(calculateCityPrice(vehicle.without_driver_daily_rate, vehicle.category_id))}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Hebdomadaire</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCDF(calculateCityPrice(vehicle.without_driver_weekly_rate, vehicle.category_id))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!vehicle.driver_available && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Horaire</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCDF(calculateCityPrice(vehicle.hourly_rate, vehicle.category_id))}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Journalier</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCDF(calculateCityPrice(vehicle.daily_rate, vehicle.category_id))}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Hebdomadaire</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCDF(calculateCityPrice(vehicle.weekly_rate, vehicle.category_id))}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dépôt de garantie */}
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Shield className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Dépôt de garantie</p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatCDF(calculateCityPrice(vehicle.security_deposit, vehicle.category_id))}
                  </p>
                </div>
              </div>

              {/* Conditions */}
              <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
                <p className="font-medium">Conditions de location :</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Permis de conduire valide requis (si sans chauffeur)</li>
                  <li>Dépôt de garantie remboursable à la fin de la location</li>
                  <li>Inspection du véhicule obligatoire avant départ</li>
                  <li>Carburant à la charge du locataire</li>
                  <li>Assurance tous risques incluse</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Réservation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="sticky bottom-4 z-10"
        >
          <Card className="border-2 border-primary shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">À partir de</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCDF(
                      calculateCityPrice(
                        vehicle.driver_available && vehicle.without_driver_daily_rate > 0
                          ? vehicle.without_driver_daily_rate
                          : vehicle.daily_rate,
                        vehicle.category_id
                      )
                    )}
                    <span className="text-sm ml-1">/ jour</span>
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={() => navigate(`/rental-booking/${vehicle.id}`)}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Réserver maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RentalVehicleDetails;
