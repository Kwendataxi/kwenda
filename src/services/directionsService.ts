import { supabase } from '@/integrations/supabase/client';

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

export interface DirectionsResult {
  distance: number; // meters
  duration: number; // seconds
  distanceText: string;
  durationText: string;
  geometry: [number, number][]; // [lng, lat] pairs
  steps: RouteStep[];
  trafficAware: boolean;
  provider: 'google' | 'fallback';
}

export interface DirectionsOptions {
  profile?: 'driving' | 'walking' | 'cycling' | 'driving-traffic';
  alternatives?: boolean;
  steps?: boolean;
  geometries?: 'geojson' | 'polyline';
  overview?: 'full' | 'simplified' | 'false';
  exclude?: string[];
}

export class DirectionsService {
  private static googleApiKey: string = '';

  static async getGoogleApiKey(): Promise<string> {
    if (this.googleApiKey) return this.googleApiKey;
    
    try {
      const response = await fetch('https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/get-google-maps-key', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch Google API key');
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      this.googleApiKey = data.apiKey;
      return this.googleApiKey;
    } catch (error) {
      console.error('Error fetching Google API key:', error);
      throw new Error('Google API key not available');
    }
  }

  static async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: DirectionsOptions = {}
  ): Promise<DirectionsResult> {
    // 🔧 FIX: Utiliser le DirectionsService Google Maps (côté client, pas d'appel HTTP)
    try {
      return await this.getGoogleDirections(origin, destination, options);
    } catch (googleError) {
      console.warn('Google directions failed, using fallback:', googleError);
      return this.getFallbackDirections(origin, destination);
    }
  }


  private static async getGoogleDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: DirectionsOptions
  ): Promise<DirectionsResult> {
    // 🔧 FIX: Utiliser google.maps.DirectionsService (API JavaScript, pas HTTP)
    // Cela évite les problèmes de CORS et fonctionne directement dans le navigateur
    
    if (!window.google?.maps?.DirectionsService) {
      throw new Error('Google Maps not loaded');
    }
    
    const directionsService = new google.maps.DirectionsService();
    
    const travelMode = options.profile === 'walking' 
      ? google.maps.TravelMode.WALKING 
      : options.profile === 'cycling' 
        ? google.maps.TravelMode.BICYCLING 
        : google.maps.TravelMode.DRIVING;
    
    const result = await directionsService.route({
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode,
      provideRouteAlternatives: options.alternatives || false,
      drivingOptions: options.profile === 'driving-traffic' ? {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      } : undefined
    });

    if (!result.routes || result.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = result.routes[0];
    const leg = route.legs[0];
    
    // 🔧 FIX: Extraire TOUS les points du path (pas juste overview)
    // Cela donne un tracé beaucoup plus précis
    const geometry: [number, number][] = [];
    
    if (leg.steps) {
      // Utiliser les steps pour un tracé haute précision
      for (const step of leg.steps) {
        if (step.path) {
          for (const point of step.path) {
            geometry.push([point.lng(), point.lat()]);
          }
        }
      }
    }
    
    // Fallback: utiliser overview_path si steps non disponibles
    if (geometry.length === 0 && route.overview_path) {
      for (const point of route.overview_path) {
        geometry.push([point.lng(), point.lat()]);
      }
    }
    
    return {
      distance: leg.distance?.value || 0,
      duration: leg.duration?.value || 0,
      distanceText: leg.distance?.text || '0 km',
      durationText: leg.duration?.text || '0 min',
      geometry,
      steps: leg.steps?.map((step) => ({
        instruction: step.instructions?.replace(/<[^>]*>/g, '') || '',
        distance: step.distance?.value || 0,
        duration: step.duration?.value || 0,
        coordinates: step.path?.map(p => [p.lng(), p.lat()] as [number, number]) || []
      })) || [],
      trafficAware: options.profile === 'driving-traffic',
      provider: 'google'
    };
  }

  private static getFallbackDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): DirectionsResult {
    // Calculate straight-line distance
    const R = 6371e3; // Earth's radius in meters
    const φ1 = origin.lat * Math.PI/180;
    const φ2 = destination.lat * Math.PI/180;
    const Δφ = (destination.lat - origin.lat) * Math.PI/180;
    const Δλ = (destination.lng - origin.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c;
    
    // Estimate duration (assume 30 km/h average speed in Kinshasa)
    const duration = (distance / 1000) / 30 * 3600;

    return {
      distance: Math.round(distance),
      duration: Math.round(duration),
      distanceText: `${(distance / 1000).toFixed(1)} km`,
      durationText: this.formatDuration(duration),
      geometry: [[origin.lng, origin.lat], [destination.lng, destination.lat]],
      steps: [{
        instruction: `Se diriger vers ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`,
        distance: Math.round(distance),
        duration: Math.round(duration),
        coordinates: [[origin.lng, origin.lat], [destination.lng, destination.lat]]
      }],
      trafficAware: false,
      provider: 'fallback'
    };
  }

  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  // Decode Google polyline algorithm
  private static decodePolyline(str: string): [number, number][] {
    let index = 0;
    const lat = 0;
    const lng = 0;
    const coordinates: [number, number][] = [];
    let lat_change: number, lng_change: number;

    let latitude = 0;
    let longitude = 0;

    while (index < str.length) {
      // Decode latitude
      let shift = 0;
      let result = 0;
      let byte: number;
      
      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      lat_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      latitude += lat_change;

      // Decode longitude
      shift = 0;
      result = 0;
      
      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      lng_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      longitude += lng_change;

      coordinates.push([longitude * 1e-5, latitude * 1e-5]);
    }

    return coordinates;
  }

  static async getMultipleRoutes(
    waypoints: { lat: number; lng: number }[],
    options: DirectionsOptions = {}
  ): Promise<DirectionsResult[]> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required');
    }

    const routes: DirectionsResult[] = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const route = await this.getDirections(waypoints[i], waypoints[i + 1], options);
      routes.push(route);
    }

    return routes;
  }

  static estimateETAWithTraffic(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<DirectionsResult> {
    return this.getDirections(origin, destination, { 
      profile: 'driving-traffic',
      steps: false 
    });
  }
}