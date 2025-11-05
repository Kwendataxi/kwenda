/**
 * 🔮 PREDICTIVE ROUTE CACHE SERVICE - Phase 3
 * Pré-calcule les routes vers les destinations populaires
 * Cache intelligent pour réduire la latence à quasi-zéro
 */

import { supabase } from '@/integrations/supabase/client';
import { routeCache } from './routeCacheService';
import { secureNavigationService } from './secureNavigationService';

interface PopularDestination {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  visitCount: number;
}

export class PredictiveRouteCacheService {
  private isPreloading = false;

  /**
   * Récupère les destinations populaires pour une ville
   * Utilise les lieux populaires existants
   */
  private getPopularDestinations(city: string): PopularDestination[] {
    // Destinations populaires par défaut pour Kinshasa
    const kinshasa = [
      { id: '1', name: 'Aéroport de N\'djili', coordinates: { lat: -4.3857, lng: 15.4446 }, visitCount: 100 },
      { id: '2', name: 'Gare Centrale', coordinates: { lat: -4.3276, lng: 15.3136 }, visitCount: 95 },
      { id: '3', name: 'Marché Central', coordinates: { lat: -4.3217, lng: 15.3069 }, visitCount: 90 },
      { id: '4', name: 'Kinshasa Mall', coordinates: { lat: -4.3089, lng: 15.2858 }, visitCount: 85 },
      { id: '5', name: 'Université de Kinshasa', coordinates: { lat: -4.4322, lng: 15.3484 }, visitCount: 80 }
    ];

    return kinshasa;
  }

  /**
   * Pré-charge les routes vers les destinations populaires
   */
  async preloadPopularRoutes(
    userLocation: { lat: number; lng: number },
    city: string = 'Kinshasa'
  ): Promise<void> {
    if (this.isPreloading) {
      console.log('⏳ [PredictiveCache] Already preloading...');
      return;
    }

    this.isPreloading = true;
    console.log('🔮 [PredictiveCache] Starting predictive preload for', city);

    try {
      const popularPlaces = await this.getPopularDestinations(city);
      console.log(`📍 [PredictiveCache] Found ${popularPlaces.length} popular destinations`);

      // Pré-charger les routes en arrière-plan (sans bloquer)
      const preloadPromises = popularPlaces.slice(0, 10).map(async (place) => {
        try {
          await routeCache.getOrCalculate(
            userLocation,
            place.coordinates,
            () => secureNavigationService.calculateRoute({
              origin: userLocation,
              destination: place.coordinates,
              mode: 'driving'
            })
          );
          console.log(`✅ [PredictiveCache] Preloaded route to ${place.name}`);
        } catch (error) {
          console.error(`❌ [PredictiveCache] Failed to preload ${place.name}:`, error);
        }
      });

      // Attendre max 5 secondes pour le préchargement
      await Promise.race([
        Promise.all(preloadPromises),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      console.log('✅ [PredictiveCache] Predictive preload completed');
    } catch (error) {
      console.error('❌ [PredictiveCache] Error during preload:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Pré-charge intelligente basée sur l'heure et le jour
   */
  async smartPreload(
    userLocation: { lat: number; lng: number },
    city: string = 'Kinshasa'
  ): Promise<void> {
    const hour = new Date().getHours();
    const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;

    // Logique contextuelle
    let context = 'general';
    if (isWeekday && hour >= 6 && hour <= 9) {
      context = 'morning_commute';
      console.log('🌅 [PredictiveCache] Morning commute detected');
    } else if (isWeekday && hour >= 17 && hour <= 20) {
      context = 'evening_commute';
      console.log('🌆 [PredictiveCache] Evening commute detected');
    } else if (!isWeekday && hour >= 10 && hour <= 18) {
      context = 'weekend_leisure';
      console.log('🎉 [PredictiveCache] Weekend leisure detected');
    }

    // Pour l'instant, on utilise la même logique
    // Dans une version avancée, on pourrait avoir des lieux différents par contexte
    await this.preloadPopularRoutes(userLocation, city);
  }
}

// Instance singleton
export const predictiveRouteCache = new PredictiveRouteCacheService();
