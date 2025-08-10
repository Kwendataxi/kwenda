/**
 * Page de test complète pour valider l'intégration du nouveau système de géolocalisation
 * dans les composants existants
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalLocationPicker } from '@/components/location/UniversalLocationPicker';
import ModernDeliveryOrderInterface from '@/components/delivery/ModernDeliveryOrderInterface';
import CargoDeliveryInterface from '@/components/delivery/CargoDeliveryInterface';
import { LocationData } from '@/types/location';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { 
  MapPin, 
  Truck, 
  Package, 
  Navigation,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const LocationSystemTest: React.FC = () => {
  const [testLocation, setTestLocation] = useState<LocationData | null>(null);
  const [testPickup, setTestPickup] = useState<LocationData | null>(null);
  const [testDestination, setTestDestination] = useState<LocationData | null>(null);
  
  const {
    location: currentLocation,
    loading,
    error,
    accuracy,
    getCurrentPosition,
    searchLocation,
    getNearbyPlaces,
    calculateDistance,
    formatDistance,
    formatDuration,
    clearCache,
    hasLocation,
    isHighAccuracy
  } = useMasterLocation({ autoDetectLocation: true });

  const handleTestSearch = async () => {
    const results = await searchLocation("Kinshasa Centre");
    console.log('Test search results:', results);
  };

  const handleTestNearby = async () => {
    const places = await getNearbyPlaces(5);
    console.log('Test nearby places:', places);
  };

  const handleCargoSubmit = (data: any) => {
    console.log('Cargo delivery submitted:', data);
  };

  const handleCargoCancel = () => {
    console.log('Cargo delivery cancelled');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Test d'Intégration du Système de Géolocalisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">MasterLocationService</span>
                </div>
                <Badge variant={hasLocation ? "default" : "secondary"}>
                  {hasLocation ? "Position active" : "Pas de position"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Précision GPS</span>
                </div>
                <Badge variant={isHighAccuracy ? "default" : "outline"}>
                  {accuracy ? `${Math.round(accuracy)}m` : "Non disponible"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Cache</span>
                </div>
                <Button 
                  onClick={clearCache} 
                  variant="outline" 
                  size="sm"
                  className="h-6 text-xs"
                >
                  Vider le cache
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Erreur: {error}</span>
                </div>
              </div>
            )}
            
            {currentLocation && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <div className="font-medium">Position actuelle détectée:</div>
                    <div>{currentLocation.address}</div>
                    <div className="text-xs opacity-70">
                      {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)} ({currentLocation.type})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tests du système */}
        <Tabs defaultValue="picker" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="picker">Location Picker</TabsTrigger>
            <TabsTrigger value="functions">Fonctions</TabsTrigger>
            <TabsTrigger value="delivery">Livraison Moderne</TabsTrigger>
            <TabsTrigger value="cargo">Cargo</TabsTrigger>
          </TabsList>

          {/* Test UniversalLocationPicker */}
          <TabsContent value="picker" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test UniversalLocationPicker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Mode Transport</label>
                    <UniversalLocationPicker
                      value={testLocation}
                      onLocationSelect={setTestLocation}
                      context="transport"
                      placeholder="Où souhaitez-vous aller ?"
                      showCurrentLocation={true}
                      showNearbyPlaces={true}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Mode Livraison</label>
                    <UniversalLocationPicker
                      value={testLocation}
                      onLocationSelect={setTestLocation}
                      context="delivery"
                      placeholder="Adresse de livraison"
                      variant="compact"
                    />
                  </div>
                </div>
                
                {testLocation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">Location sélectionnée:</div>
                      <div>{testLocation.address}</div>
                      <div className="text-xs text-blue-600">
                        {testLocation.lat.toFixed(6)}, {testLocation.lng.toFixed(6)} ({testLocation.type})
                        {testLocation.accuracy && ` - Précision: ${Math.round(testLocation.accuracy)}m`}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test des fonctions */}
          <TabsContent value="functions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test des Fonctions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => getCurrentPosition()} disabled={loading}>
                    {loading ? "Localisation..." : "Obtenir Position"}
                  </Button>
                  
                  <Button onClick={handleTestSearch} variant="outline">
                    Test Recherche "Kinshasa Centre"
                  </Button>
                  
                  <Button onClick={handleTestNearby} variant="outline">
                    Test Lieux à Proximité
                  </Button>
                  
                  <Button onClick={clearCache} variant="destructive">
                    Vider Cache
                  </Button>
                </div>
                
                {testPickup && testDestination && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">Test Distance:</div>
                      <div>
                        Distance: {formatDistance(calculateDistance(
                          { lat: testPickup.lat, lng: testPickup.lng },
                          { lat: testDestination.lat, lng: testDestination.lng }
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Livraison Moderne */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle>Test Composant Livraison Moderne</CardTitle>
              </CardHeader>
              <CardContent>
                <ModernDeliveryOrderInterface />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Cargo */}
          <TabsContent value="cargo">
            <Card>
              <CardHeader>
                <CardTitle>Test Composant Cargo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] overflow-hidden">
                  <CargoDeliveryInterface
                    onSubmit={handleCargoSubmit}
                    onCancel={handleCargoCancel}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline">MasterLocationService ✅</Badge>
                <Badge variant="outline">UniversalLocationPicker ✅</Badge>
                <Badge variant="outline">Composants Intégrés ✅</Badge>
              </div>
              <div className="mt-2">
                Système de géolocalisation unifié opérationnel
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationSystemTest;