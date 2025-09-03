import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IntelligentAddressSearch } from '@/components/location/IntelligentAddressSearch';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star } from 'lucide-react';

export default function AddressSearchDemo() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              🧠 Recherche d'Adresse Intelligente
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Système de recherche avec base de données locale enrichie + fallback Google Maps
            </p>
          </CardHeader>
        </Card>

        {/* Demo principale */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Composant de recherche */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Recherche d'Adresse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <IntelligentAddressSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Rechercher une adresse à Kinshasa..."
                city="Kinshasa"
                country_code="CD"
                showCurrentLocation={true}
                showPopularPlaces={true}
                showRecentSearches={true}
              />
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Fonctionnalités :</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Autocomplétion rapide
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Scoring intelligent
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    🗂️ Base de données locale
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    🌐 Fallback Google Maps
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    🎤 Recherche vocale
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    📍 Géolocalisation
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résultat sélectionné */}
          <Card>
            <CardHeader>
              <CardTitle>Résultat Sélectionné</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLocation ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{selectedLocation.name}</h3>
                      {selectedLocation.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {selectedLocation.subtitle}
                        </p>
                      )}
                    </div>
                    {selectedLocation.badge && (
                      <Badge variant="outline">{selectedLocation.badge}</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Latitude:</span><br/>
                      <code className="text-xs bg-muted px-1 rounded">
                        {selectedLocation.lat?.toFixed(6)}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span><br/>
                      <code className="text-xs bg-muted px-1 rounded">
                        {selectedLocation.lng?.toFixed(6)}
                      </code>
                    </div>
                  </div>

                  {selectedLocation.category && (
                    <div className="text-sm">
                      <span className="font-medium">Catégorie:</span> {selectedLocation.category}
                    </div>
                  )}

                  {selectedLocation.relevance_score && (
                    <div className="text-sm">
                      <span className="font-medium">Score de pertinence:</span> {selectedLocation.relevance_score.toFixed(1)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Sélectionnez une adresse pour voir les détails
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Comment tester ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Recherches suggérées :</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• "Gombe" - commune populaire</li>
                  <li>• "Aéroport" - infrastructures</li>
                  <li>• "Hôpital" - services de santé</li>
                  <li>• "Université" - éducation</li>
                  <li>• "Marché" - commerce</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Fonctionnalités à tester :</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Autocomplétion en temps réel</li>
                  <li>• Bouton géolocalisation</li>
                  <li>• Recherche vocale (micro)</li>
                  <li>• Lieux populaires par défaut</li>
                  <li>• Recherches récentes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}