/**
 * Page de test pour le système de recherche d'adresses intelligent
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntelligentAddressSearch } from '@/components/location/IntelligentAddressSearch';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
import { type IntelligentSearchResult } from '@/services/IntelligentAddressSearch';
import { Search, MapPin, Clock, Star, Navigation2 } from 'lucide-react';

export default function IntelligentSearchTest() {
  const [selectedLocation, setSelectedLocation] = useState<IntelligentSearchResult | null>(null);
  const [currentCity, setCurrentCity] = useState<'Kinshasa' | 'Lubumbashi' | 'Kolwezi'>('Kinshasa');
  
  const {
    results,
    isSearching,
    error,
    popularPlaces,
    search,
    getPopularPlaces,
    clearResults,
    clearCache,
    addToHistory
  } = useIntelligentAddressSearch({
    city: currentCity,
    country_code: 'CD',
    maxResults: 10,
    autoSearchOnMount: true,
    cacheResults: true
  });

  const handleLocationSelect = async (location: IntelligentSearchResult) => {
    setSelectedLocation(location);
    await addToHistory(location);
  };

  const handleManualSearch = async (query: string) => {
    if (query.length >= 2) {
      await search(query);
    }
  };

  const handleCityChange = (city: 'Kinshasa' | 'Lubumbashi' | 'Kolwezi') => {
    setCurrentCity(city);
    clearResults();
    setSelectedLocation(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport': return 'bg-blue-100 text-blue-800';
      case 'education': return 'bg-green-100 text-green-800';
      case 'health': return 'bg-red-100 text-red-800';
      case 'commercial': return 'bg-purple-100 text-purple-800';
      case 'administrative': return 'bg-gray-100 text-gray-800';
      case 'sport': return 'bg-orange-100 text-orange-800';
      case 'industry': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl text-grey-900">
                  Test du Système de Recherche Intelligent
                </CardTitle>
                <p className="text-grey-600 mt-1">
                  Interface type Yango pour Kinshasa, Lubumbashi et Kolwezi
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Sélecteur de ville */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-grey-700">Ville :</span>
              <div className="flex gap-2">
                {(['Kinshasa', 'Lubumbashi', 'Kolwezi'] as const).map((city) => (
                  <Button
                    key={city}
                    variant={currentCity === city ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCityChange(city)}
                  >
                    {city}
                  </Button>
                ))}
              </div>
              <Badge variant="secondary" className="ml-auto">
                {currentCity}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="component" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="component">Composant de Recherche</TabsTrigger>
            <TabsTrigger value="results">Résultats & Tests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Performance</TabsTrigger>
          </TabsList>

          {/* Onglet Composant */}
          <TabsContent value="component" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Interface de recherche */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Interface de Recherche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <IntelligentAddressSearch
                    onLocationSelect={handleLocationSelect}
                    city={currentCity}
                    country_code="CD"
                    placeholder={`Rechercher à ${currentCity}...`}
                    showCurrentLocation={true}
                    showPopularPlaces={true}
                    maxResults={8}
                    autoFocus={false}
                  />
                </CardContent>
              </Card>

              {/* Lieu sélectionné */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation2 className="w-5 h-5" />
                    Lieu Sélectionné
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLocation ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                          {selectedLocation.category === 'transport' ? '🚌' :
                           selectedLocation.category === 'education' ? '🎓' :
                           selectedLocation.category === 'health' ? '🏥' :
                           selectedLocation.category === 'commercial' ? '🏪' : '📍'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-grey-900">{selectedLocation.name}</h3>
                          <p className="text-sm text-grey-600">{selectedLocation.subtitle}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getCategoryColor(selectedLocation.category)}>
                              {selectedLocation.badge || selectedLocation.category}
                            </Badge>
                            {selectedLocation.popularity_score > 70 && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                Populaire
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-grey-500">Coordonnées :</span>
                          <p className="font-mono">{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>
                        </div>
                        <div>
                          <span className="text-grey-500">Score :</span>
                          <p className="font-mono">{selectedLocation.relevance_score.toFixed(1)}</p>
                        </div>
                        <div>
                          <span className="text-grey-500">Niveau :</span>
                          <p>{selectedLocation.hierarchy_level}</p>
                        </div>
                        <div>
                          <span className="text-grey-500">Type :</span>
                          <p>{selectedLocation.type}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-grey-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun lieu sélectionné</p>
                      <p className="text-sm">Utilisez la recherche ci-dessus</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Résultats */}
          <TabsContent value="results" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Test manuel */}
              <Card>
                <CardHeader>
                  <CardTitle>Test de Recherche Manuel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tapez votre recherche..."
                      className="flex-1 px-3 py-2 border border-grey-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualSearch(e.currentTarget.value);
                        }
                      }}
                    />
                    <Button 
                      onClick={() => getPopularPlaces()}
                      variant="outline"
                      size="sm"
                    >
                      Populaires
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={clearResults} variant="outline" size="sm">
                      Vider
                    </Button>
                    <Button onClick={clearCache} variant="outline" size="sm">
                      Vider Cache
                    </Button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Résultats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Résultats de Recherche
                    {isSearching && (
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                      results.map((result, index) => (
                        <div
                          key={result.id}
                          className="flex items-center gap-3 p-3 border border-grey-200 rounded-lg hover:bg-grey-50 cursor-pointer transition-colors"
                          onClick={() => handleLocationSelect(result)}
                        >
                          <div className="text-lg">
                            {result.category === 'transport' ? '🚌' :
                             result.category === 'education' ? '🎓' :
                             result.category === 'health' ? '🏥' :
                             result.category === 'commercial' ? '🏪' : '📍'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-grey-900 truncate">{result.name}</p>
                            <p className="text-sm text-grey-600 truncate">{result.subtitle}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {result.badge}
                              </Badge>
                              <span className="text-xs text-grey-500">
                                Score: {result.relevance_score.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          {result.popularity_score > 70 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-grey-500">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Aucun résultat</p>
                        <p className="text-sm">Effectuez une recherche pour voir les résultats</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-grey-600">Résultats Trouvés</p>
                      <p className="text-2xl font-bold text-grey-900">{results.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-grey-600">Statut</p>
                      <p className="text-lg font-semibold text-grey-900">
                        {isSearching ? 'Recherche...' : 'Prêt'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-grey-600">Lieux Populaires</p>
                      <p className="text-2xl font-bold text-grey-900">{popularPlaces.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance du Système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-grey-900 mb-3">Fonctionnalités Actives</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Recherche par base de données</span>
                        <Badge variant="default">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Fallback Google Maps</span>
                        <Badge variant="default">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Géolocalisation</span>
                        <Badge variant="default">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Cache intelligent</span>
                        <Badge variant="default">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Recherche vocale</span>
                        <Badge variant="secondary">Disponible</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-grey-900 mb-3">Couverture Géographique</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Kinshasa</span>
                        <Badge variant="default">100%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Lubumbashi</span>
                        <Badge variant="default">95%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-grey-600">Kolwezi</span>
                        <Badge variant="default">90%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}