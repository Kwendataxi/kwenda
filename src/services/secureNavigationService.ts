/**
 * 🔒 Service de Navigation Sécurisé
 * Wrapper sécurisé pour les appels à Google Directions API via Edge Function
 */

import { supabase } from '@/integrations/supabase/client';
import { NavigationRoute } from '@/types/map';
import { toast } from 'sonner';

interface CalculateRouteOptions {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: Array<{ lat: number; lng: number }>;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  mode?: 'driving' | 'walking' | 'bicycling';
}

class SecureNavigationService {
  /**
   * Calculer un itinéraire de manière sécurisée via Edge Function
   */
  async calculateRoute(options: CalculateRouteOptions): Promise<NavigationRoute | null> {
    const {
      origin,
      destination,
      waypoints = [],
      avoidTolls = false,
      avoidHighways = false,
      mode = 'driving'
    } = options;

    try {
      console.log('🗺️ Calcul d\'itinéraire sécurisé via proxy...');

      // Construire les paramètres pour l'appel à google-maps-proxy
      const params: Record<string, any> = {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode,
        language: 'fr',
        traffic_model: 'best_guess',
        departure_time: 'now', // Pour inclure le trafic en temps réel
        alternatives: false
      };

      // Ajouter les waypoints si présents
      if (waypoints.length > 0) {
        params.waypoints = waypoints
          .map(wp => `${wp.lat},${wp.lng}`)
          .join('|');
      }

      // Options d'évitement
      const avoid: string[] = [];
      if (avoidTolls) avoid.push('tolls');
      if (avoidHighways) avoid.push('highways');
      if (avoid.length > 0) {
        params.avoid = avoid.join('|');
      }

      // Appel sécurisé via Edge Function
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          service: 'directions',
          params
        }
      });

      if (error) {
        console.error('❌ Erreur proxy directions:', error);
        toast.error('Impossible de calculer l\'itinéraire');
        return null;
      }

      if (data?.status === 'OK' && data?.routes?.[0]) {
        const route = data.routes[0];
        const leg = route.legs[0];

        const navigationRoute: NavigationRoute = {
          distance: leg.distance.value,
          duration: leg.duration.value,
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          steps: leg.steps.map((step: any) => ({
            instruction: this.cleanHtmlInstruction(step.html_instructions),
            distance: step.distance.value,
            duration: step.duration.value,
            maneuver: step.maneuver
          })),
          polyline: route.overview_polyline.points
        };

        console.log(`✅ Itinéraire calculé: ${navigationRoute.distanceText}, ${navigationRoute.durationText}`);
        return navigationRoute;
      }

      console.warn('⚠️ Aucun itinéraire trouvé');
      toast.warning('Aucun itinéraire disponible pour cette destination');
      return null;

    } catch (error) {
      console.error('❌ Erreur calcul itinéraire:', error);
      toast.error('Erreur lors du calcul de l\'itinéraire');
      return null;
    }
  }

  /**
   * Calculer l'ETA avec prise en compte du trafic
   */
  async calculateETAWithTraffic(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ duration: number; durationInTraffic?: number } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          service: 'distancematrix',
          params: {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${destination.lat},${destination.lng}`,
            mode: 'driving',
            language: 'fr',
            traffic_model: 'best_guess',
            departure_time: 'now'
          }
        }
      });

      if (error || data?.status !== 'OK') {
        console.error('❌ Erreur calcul ETA:', error);
        return null;
      }

      const element = data.rows?.[0]?.elements?.[0];
      if (element?.status === 'OK') {
        return {
          duration: element.duration.value,
          durationInTraffic: element.duration_in_traffic?.value
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur ETA:', error);
      return null;
    }
  }

  /**
   * Nettoyer les instructions HTML de Google Maps
   */
  private cleanHtmlInstruction(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * Décoder un polyline encodé en coordonnées
   */
  decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
    const poly: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return poly;
  }
}

export const secureNavigationService = new SecureNavigationService();
