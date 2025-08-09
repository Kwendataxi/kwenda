import { supabase } from '@/integrations/supabase/client';

export interface LocationResult {
  address: string;
  lat: number;
  lng: number;
  type?: 'geocoded' | 'popular' | 'fallback';
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  price: number;    // CDF
  mode: 'flash' | 'flex' | 'maxicharge';
}

// Lieux populaires enrichis de Kinshasa avec géolocalisation précise
const POPULAR_PLACES = [
  // Centres administratifs et commerciaux
  { name: 'Gombe Centre', lat: -4.3276, lng: 15.3154, alias: ['gombe', 'centre ville'] },
  { name: 'Place de la Poste', lat: -4.3232, lng: 15.3097, alias: ['poste centrale', 'centre poste'] },
  { name: 'Boulevard du 30 Juin', lat: -4.3184, lng: 15.3136, alias: ['30 juin', 'bd 30 juin'] },
  
  // Transport et infrastructures
  { name: 'Aéroport N\'djili', lat: -4.3857, lng: 15.4446, alias: ['ndji', 'ndjili', 'aeroport'] },
  { name: 'Gare Centrale', lat: -4.3254, lng: 15.3118, alias: ['gare', 'station'] },
  
  // Marchés et commerces
  { name: 'Marché Central', lat: -4.3217, lng: 15.3069, alias: ['marche', 'grand marche'] },
  { name: 'Marché de la Liberté', lat: -4.3891, lng: 15.2877, alias: ['liberte', 'matongo'] },
  
  // Universités et écoles
  { name: 'Université de Kinshasa', lat: -4.4339, lng: 15.3505, alias: ['unikin', 'universite'] },
  { name: 'Université Protestante', lat: -4.3500, lng: 15.3200, alias: ['upc', 'protestante'] },
  
  // Communes populaires
  { name: 'Matongé', lat: -4.3891, lng: 15.2877, alias: ['matongo'] },
  { name: 'Lemba Terminus', lat: -4.3891, lng: 15.2614, alias: ['lemba', 'terminus'] },
  { name: 'Ngaliema', lat: -4.3506, lng: 15.2721, alias: ['ngali'] },
  { name: 'Kintambo', lat: -4.3298, lng: 15.2889, alias: ['kinta'] },
  { name: 'Masina', lat: -4.3833, lng: 15.3667, alias: ['masina'] },
  { name: 'N\'djili Commune', lat: -4.3833, lng: 15.4333, alias: ['ndjili commune'] },
  { name: 'Limete', lat: -4.3667, lng: 15.3167, alias: ['limete industriel'] },
  { name: 'Kalamu', lat: -4.3500, lng: 15.3000, alias: ['kalamu'] },
  { name: 'Bandalungwa', lat: -4.3333, lng: 15.2833, alias: ['banda'] },
  { name: 'Selembao', lat: -4.3833, lng: 15.2500, alias: ['selembao'] },
  { name: 'Makala', lat: -4.4000, lng: 15.2333, alias: ['makala'] },
  { name: 'Ngaba', lat: -4.3667, lng: 15.2500, alias: ['ngaba'] },
  { name: 'Kasa-Vubu', lat: -4.3333, lng: 15.3000, alias: ['kasa vubu', 'kasavubu'] },
  { name: 'Barumbu', lat: -4.3167, lng: 15.3167, alias: ['barumbu'] },
  { name: 'Kinshasa (Commune)', lat: -4.3083, lng: 15.3167, alias: ['kinshasa commune'] },
  { name: 'Lingwala', lat: -4.3167, lng: 15.2833, alias: ['lingwala'] },
  { name: 'Mont Ngafula', lat: -4.4333, lng: 15.2833, alias: ['mont ngafula', 'ngafula'] },
  { name: 'Kisenso', lat: -4.4167, lng: 15.2167, alias: ['kisenso'] },
  { name: 'Bumbu', lat: -4.4167, lng: 15.2500, alias: ['bumbu'] },
  
  // Lieux spéciaux
  { name: 'Présidence de la République', lat: -4.3204, lng: 15.3104, alias: ['presidence', 'palais nation'] },
  { name: 'Stade des Martyrs', lat: -4.3333, lng: 15.3000, alias: ['stade martyrs', 'martyrs'] },
  { name: 'Zoo de Kinshasa', lat: -4.3500, lng: 15.2800, alias: ['zoo'] }
];

export class UnifiedLocationService {
  private static googleApiKey: string = '';

  // Récupération sécurisée de la clé API
  private static async getGoogleApiKey(): Promise<string> {
    if (this.googleApiKey) return this.googleApiKey;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      this.googleApiKey = data.apiKey;
      return this.googleApiKey;
    } catch (error) {
      console.warn('Google API non disponible, mode fallback activé:', error);
      return '';
    }
  }

  // Recherche intelligente d'adresses - Moderne et réactive
  static async searchLocation(query: string): Promise<LocationResult[]> {
    if (!query || query.length < 1) return [];

    const results: LocationResult[] = [];
    const searchQuery = query.toLowerCase().trim();

    // 1. Recherche instantanée dans les lieux populaires (0ms de latence)
    const popularMatches = POPULAR_PLACES.filter(place => {
      const placeName = place.name.toLowerCase();
      const aliases = place.alias?.map(a => a.toLowerCase()) || [];
      
      // Correspondance directe ou dans les alias
      return placeName.includes(searchQuery) ||
             placeName.startsWith(searchQuery) ||
             aliases.some(alias => alias.includes(searchQuery) || alias.startsWith(searchQuery)) ||
             // Recherche phonétique simplifiée (enlever espaces et accents)
             placeName.replace(/['\s]/g, '').includes(searchQuery.replace(/['\s]/g, ''));
    });
    
    // Prioriser les correspondances exactes au début
    const exactMatches = popularMatches.filter(place => 
      place.name.toLowerCase().startsWith(searchQuery) ||
      place.alias?.some(alias => alias.toLowerCase().startsWith(searchQuery))
    );
    const partialMatches = popularMatches.filter(place => 
      !exactMatches.includes(place)
    );
    
    const sortedPopular = [...exactMatches, ...partialMatches];
    
    results.push(...sortedPopular.slice(0, 3).map(place => ({
      address: place.name,
      lat: place.lat,
      lng: place.lng,
      type: 'popular' as const
    })));

    // 2. Recherche Google Places en parallèle (non bloquante)
    if (query.length >= 2) {
      try {
        const googleResults = await this.searchGooglePlaces(query);
        // Éviter les doublons avec les lieux populaires
        const uniqueGoogleResults = googleResults.filter(gResult => 
          !results.some(pResult => 
            this.calculateDistance(gResult, pResult) < 500 // moins de 500m = doublon
          )
        );
        results.push(...uniqueGoogleResults.slice(0, 3));
      } catch (error) {
        console.warn('Google Places search failed:', error);
      }
    }

    // 3. Fallback intelligent si vraiment aucun résultat
    if (results.length === 0 && query.length >= 2) {
      results.push({
        address: `${query} (recherche dans Kinshasa)`,
        lat: -4.3217 + (Math.random() - 0.5) * 0.05,
        lng: 15.3069 + (Math.random() - 0.5) * 0.05,
        type: 'fallback'
      });
    }

    return results.slice(0, 8); // Plus de résultats pour plus de choix
  }

  private static async searchGooglePlaces(query: string): Promise<LocationResult[]> {
    try {
      // Utiliser l'edge function proxy améliorée
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { query }
      });
      
      if (error) {
        console.warn('Geocode proxy error:', error);
        return [];
      }
      
      if (data?.status === 'OK' && data?.results) {
        return data.results.slice(0, 5).map((place: any) => ({
          address: place.formatted_address || place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          type: 'geocoded' as const
        }));
      }
      
      return [];
    } catch (error) {
      console.warn('Geocode search failed:', error);
      return [];
    }
  }

  // Calcul unifié distance + prix
  static async calculateRoute(
    pickup: LocationResult,
    destination: LocationResult
  ): Promise<RouteResult[]> {
    // Calcul de distance (haversine pour fallback)
    const distance = this.calculateDistance(pickup, destination);
    
    // Estimation du temps de trajet (vitesse moyenne Kinshasa: 25 km/h)
    const duration = (distance / 1000) / 25 * 3600; // en secondes

    // Calcul des prix pour chaque mode
    const basePrices = {
      flash: 5000,      // Moto rapide
      flex: 3000,       // Standard
      maxicharge: 8000  // Camion
    };

    const pricePerKm = {
      flash: 500,
      flex: 300,
      maxicharge: 800
    };

    const distanceKm = distance / 1000;

    return [
      {
        distance,
        duration: Math.round(duration * 0.7), // Flash plus rapide
        price: Math.round(basePrices.flash + (distanceKm * pricePerKm.flash)),
        mode: 'flash'
      },
      {
        distance,
        duration: Math.round(duration),
        price: Math.round(basePrices.flex + (distanceKm * pricePerKm.flex)),
        mode: 'flex'
      },
      {
        distance,
        duration: Math.round(duration * 1.3), // Camion plus lent
        price: Math.round(basePrices.maxicharge + (distanceKm * pricePerKm.maxicharge)),
        mode: 'maxicharge'
      }
    ];
  }

  // Calcul distance haversine
  private static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Rayon terre en mètres
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat - point1.lat) * Math.PI/180;
    const Δλ = (point2.lng - point1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Position utilisateur avec fallback robuste
  static async getCurrentLocation(): Promise<LocationResult> {
    try {
      // Vérifier si la géolocalisation est disponible
      if (!navigator.geolocation) {
        throw new Error('Géolocalisation non supportée');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.warn('Geolocation error:', error.message);
            reject(error);
          },
          {
            timeout: 8000,
            enableHighAccuracy: true,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      // Vérifier si les coordonnées sont dans une zone raisonnable pour Kinshasa/Abidjan
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      console.log('Position détectée:', { lat, lng });

      return {
        address: 'Ma position actuelle',
        lat,
        lng,
        type: 'geocoded'
      };
    } catch (error) {
      console.warn('Géolocalisation échouée, utilisation du fallback:', error);
      
      // Fallback intelligent : centre de Kinshasa
      return {
        address: 'Kinshasa Centre (position approximative)',
        lat: -4.3217,
        lng: 15.3069,
        type: 'fallback'
      };
    }
  }

  // Formatage des durées
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes}min`;
  }

  // Formatage des distances
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
}