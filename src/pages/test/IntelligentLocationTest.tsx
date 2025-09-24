/**
 * 🧪 PAGE DE TEST - GÉOLOCALISATION INTELLIGENTE
 * 
 * Test complet du nouveau système de géolocalisation
 */

import React, { useState } from 'react';
import { IntelligentLocationPicker } from '@/components/location/IntelligentLocationPicker';
import { useIntelligentLocation } from '@/hooks/useIntelligentLocation';
import { LocationData } from '@/services/intelligentLocationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Navigation, Search, Clock, Star, Zap } from 'lucide-react';

export default function IntelligentLocationTest() {
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [trackingLocation, setTrackingLocation] = useState<LocationData | null>(null);

  const {
    currentPosition,
    loading,
    error,
    isTracking,
    searchResults,
    searchLoading,
    getCurrentPosition,
    startTracking,
    stopTracking,
    calculateDistance,
    formatDistance,
    clearError,
    setCurrentCity
  } = useIntelligentLocation();

  const handleStartTracking = async () => {
    try {
      await startTracking({
        enableHighAccuracy: true,
        distanceFilter: 10 // 10 mètres
      });
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
  };

  // Calcul de distance entre pickup et delivery
  const getDeliveryDistance = () => {
    if (pickupLocation && deliveryLocation) {
      const distance = calculateDistance(pickupLocation, deliveryLocation);
      return formatDistance(distance);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              🎯 Test Géolocalisation Intelligente
            </CardTitle>
            <p className="text-muted-foreground">
              Test complet du nouveau système unifié avec IA, GPS et Google Places API
            </p>
          </CardHeader>
        </Card>

        {/* Contrôles de ville */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Sélection de Ville
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'].map(city => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentCity(city)}
                >
                  {city}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sélecteurs de localisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Sélecteurs de Lieux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <IntelligentLocationPicker
                  label="📍 Lieu de ramassage"
                  placeholder="Où récupérer..."
                  value={pickupLocation}
                  onChange={setPickupLocation}
                  context="pickup"
                  showAccuracy={true}
                />
              </div>

              <div>
                <IntelligentLocationPicker
                  label="🎯 Destination"
                  placeholder="Où livrer..."
                  value={deliveryLocation}
                  onChange={setDeliveryLocation}
                  context="delivery"
                  showAccuracy={true}
                />
              </div>

              {/* Calcul de distance */}
              {pickupLocation && deliveryLocation && (
                <div className="p-3 bg-accent/20 rounded-lg">
                  <div className="text-sm font-medium">Distance estimée</div>
                  <div className="text-lg font-bold text-primary">
                    {getDeliveryDistance()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Position actuelle et tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Position & Tracking GPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => getCurrentPosition({ enableHighAccuracy: true })}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Localisation...' : 'Obtenir Position'}
                </Button>
                
                <Button
                  onClick={isTracking ? stopTracking : handleStartTracking}
                  variant={isTracking ? "destructive" : "default"}
                  size="sm"
                >
                  {isTracking ? 'Arrêter Suivi' : 'Démarrer Suivi'}
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearError}
                    className="ml-2"
                  >
                    Effacer
                  </Button>
                </div>
              )}

              {currentPosition && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={currentPosition.type === 'gps' ? 'default' : 'secondary'}>
                      {currentPosition.type?.toUpperCase()}
                    </Badge>
                    {isTracking && (
                      <Badge variant="outline" className="animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        En temps réel
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium">{currentPosition.address}</div>
                    <div className="text-muted-foreground">
                      {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                    </div>
                    {currentPosition.accuracy && (
                      <div className="text-xs text-muted-foreground">
                        Précision: ±{Math.round(currentPosition.accuracy)}m
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Résultats de recherche en temps réel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Résultats de Recherche
              {searchLoading && (
                <Badge variant="outline" className="animate-pulse">
                  Recherche...
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <div className="grid gap-2">
                {searchResults.slice(0, 5).map((result, index) => (
                  <div key={result.id || index} className="flex items-center gap-3 p-2 bg-accent/10 rounded-lg">
                    <div className="flex-shrink-0">
                      {result.isPopular ? (
                        <Star className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <MapPin className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {result.title || result.name || result.address}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {result.subtitle || 'Kinshasa, RDC'}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {result.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Effectuez une recherche pour voir les résultats
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations de débogage */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Informations de Débogage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>État de chargement:</strong> {loading ? 'Oui' : 'Non'}
              </div>
              <div>
                <strong>Suivi actif:</strong> {isTracking ? 'Oui' : 'Non'}
              </div>
              <div>
                <strong>Recherche en cours:</strong> {searchLoading ? 'Oui' : 'Non'}
              </div>
              <div>
                <strong>Résultats trouvés:</strong> {searchResults.length}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="text-xs text-muted-foreground">
              💡 Ce système combine GPS natif, Google Places API, géolocalisation IP et cache intelligent
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}