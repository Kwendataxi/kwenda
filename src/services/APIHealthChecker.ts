/**
 * 🔍 API HEALTH CHECKER - LAYER 1: SURVEILLANCE DES ENDPOINTS
 * Vérifie la santé des Edge Functions et active les fallbacks
 */

import { supabase } from '@/integrations/supabase/client';
import { healthMonitor } from './HealthMonitor';

export type APIStatus = 'up' | 'down' | 'degraded' | 'unknown';

interface APIEndpoint {
  name: string;
  functionName: string;
  status: APIStatus;
  lastCheck: number;
  consecutiveFailures: number;
  avgLatency: number;
  fallbackEnabled: boolean;
}

export class APIHealthChecker {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  constructor() {
    this.initializeEndpoints();
  }

  private initializeEndpoints() {
    const endpoints = [
      { name: 'geocode', functionName: 'geocode-proxy' },
      { name: 'maps', functionName: 'get-google-maps-key' },
      { name: 'wallet', functionName: 'wallet-topup' },
      { name: 'dispatcher', functionName: 'ride-dispatcher' },
      { name: 'places', functionName: 'google-places-autocomplete' },
      { name: 'place-details', functionName: 'google-place-details' }
    ];

    endpoints.forEach(ep => {
      this.endpoints.set(ep.name, {
        name: ep.name,
        functionName: ep.functionName,
        status: 'unknown',
        lastCheck: 0,
        consecutiveFailures: 0,
        avgLatency: 0,
        fallbackEnabled: false
      });
    });
  }

  public startMonitoring() {
    // ✅ OPTIMISATION : Check unique au démarrage seulement
    // Plus de polling répétitif pour économiser batterie et bande passante
    this.checkAllEndpoints();
    
    // Les checks ultérieurs se feront uniquement sur demande via forceCheck()
  }

  private async checkAllEndpoints() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    
    const checks = Array.from(this.endpoints.values()).map(endpoint =>
      this.checkEndpoint(endpoint.name)
    );
    
    await Promise.allSettled(checks);
    
    this.isChecking = false;
  }

  public async checkEndpoint(name: string): Promise<APIStatus> {
    const endpoint = this.endpoints.get(name);
    if (!endpoint) return 'unknown';

    const start = performance.now();
    
    try {
      // Lightweight ping avec timeout court
      const { error } = await supabase.functions.invoke(endpoint.functionName, {
        body: { health_check: true },
        headers: {
          'X-Health-Check': 'true'
        }
      });

      const latency = performance.now() - start;

      // Success
      if (!error || latency < 5000) {
        endpoint.status = latency > 3000 ? 'degraded' : 'up';
        endpoint.consecutiveFailures = 0;
        endpoint.avgLatency = (endpoint.avgLatency * 0.7) + (latency * 0.3);
        endpoint.lastCheck = Date.now();
        
        // Désactiver fallback si retour à la normale
        if (endpoint.fallbackEnabled && endpoint.consecutiveFailures === 0) {
          endpoint.fallbackEnabled = false;
          console.log(`✅ [APIHealthChecker] ${name} rétabli, fallback désactivé`);
        }

        healthMonitor.recordAPICall(endpoint.functionName, true, latency);
        
        return endpoint.status;
      }

      // Failure
      throw error;
      
    } catch (error) {
      const latency = performance.now() - start;
      
      endpoint.consecutiveFailures++;
      endpoint.lastCheck = Date.now();
      
      // Activer fallback après 3 échecs
      if (endpoint.consecutiveFailures >= 3) {
        endpoint.status = 'down';
        
        if (!endpoint.fallbackEnabled) {
          endpoint.fallbackEnabled = true;
          console.error(`🔴 [APIHealthChecker] ${name} DOWN, fallback activé`);
          this.activateFallback(name);
        }
      } else {
        endpoint.status = 'degraded';
      }

      healthMonitor.recordAPICall(endpoint.functionName, false, latency);
      
      return endpoint.status;
    }
  }

  private activateFallback(endpointName: string) {
    switch (endpointName) {
      case 'geocode':
        console.log('🔄 Fallback: Utilisation du cache local de géocodage');
        // Le fallback est géré dans useSmartGeolocation
        break;
      
      case 'maps':
        console.log('🔄 Fallback: Bascule vers Mapbox');
        // Le fallback est géré dans les composants Map
        break;
      
      case 'dispatcher':
        console.log('🔄 Fallback: Queue locale pour dispatch');
        // Le fallback est géré dans le système de dispatch
        break;
      
      default:
        console.warn(`⚠️ Pas de fallback défini pour ${endpointName}`);
    }
  }

  public getEndpointStatus(name: string): APIStatus {
    return this.endpoints.get(name)?.status || 'unknown';
  }

  public isEndpointHealthy(name: string): boolean {
    const status = this.getEndpointStatus(name);
    return status === 'up' || status === 'degraded';
  }

  public shouldUseFallback(name: string): boolean {
    const endpoint = this.endpoints.get(name);
    return endpoint?.fallbackEnabled || false;
  }

  public getAllStatuses(): Record<string, APIStatus> {
    const statuses: Record<string, APIStatus> = {};
    this.endpoints.forEach((endpoint, name) => {
      statuses[name] = endpoint.status;
    });
    return statuses;
  }

  public getDetailedStatus() {
    const details: any = {};
    this.endpoints.forEach((endpoint, name) => {
      details[name] = {
        status: endpoint.status,
        latency: Math.round(endpoint.avgLatency),
        failures: endpoint.consecutiveFailures,
        fallback: endpoint.fallbackEnabled,
        lastCheck: endpoint.lastCheck
      };
    });
    return details;
  }

  public forceCheck(name: string) {
    return this.checkEndpoint(name);
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Instance singleton
export const apiHealthChecker = new APIHealthChecker();
