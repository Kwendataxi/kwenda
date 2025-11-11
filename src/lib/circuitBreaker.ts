/**
 * CIRCUIT BREAKER PATTERN - PHASE 9 (Disaster Recovery)
 * Protection contre les défaillances en cascade
 * Implémente les états: CLOSED, OPEN, HALF_OPEN
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  timeout?: number;
  halfOpenRequests?: number;
  onStateChange?: (state: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;

  constructor(
    private name: string,
    private threshold: number = 5,
    private timeout: number = 60000, // 1 min
    private halfOpenRequests: number = 3,
    private onStateChange?: (state: CircuitState) => void
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    // Si circuit ouvert, vérifier si on peut passer en HALF_OPEN
    if (this.state === 'OPEN') {
      const timeLeft = Math.ceil((this.timeout - (Date.now() - this.lastFailureTime)) / 1000);
      
      if (Date.now() - this.lastFailureTime > this.timeout) {
        console.log(`🔄 [Circuit Breaker: ${this.name}] Tentative de récupération (HALF_OPEN)`);
        this.setState('HALF_OPEN');
        this.successCount = 0;
        this.halfOpenAttempts = 0;
      } else {
        const error = new Error(`Circuit breaker [${this.name}] is OPEN. Retry after ${timeLeft}s`);
        console.error(`⛔ [Circuit Breaker: ${this.name}] Bloqué - ${timeLeft}s restantes`);
        throw error;
      }
    }

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      if (duration > 5000) {
        console.warn(`⏱️ [Circuit Breaker: ${this.name}] Requête lente: ${duration}ms`);
      }
      
      this.onSuccess();
      return result;
    } catch (error) {
      console.error(`❌ [Circuit Breaker: ${this.name}] Échec:`, error);
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      this.halfOpenAttempts++;

      // Si suffisamment de succès en HALF_OPEN, revenir à CLOSED
      if (this.successCount >= this.halfOpenRequests) {
        this.setState('CLOSED');
      }
    }
  }

  private shouldCountAsFailure(error: any): boolean {
    // Ne compter que les erreurs critiques
    if (error?.message?.includes('timeout') || error?.message?.includes('AbortError')) {
      return true; // Timeout = échec critique
    }
    
    if (error?.status >= 500) {
      return true; // Erreur serveur = échec critique
    }
    
    // Ignorer 401, 404, 400 = erreurs normales
    if (error?.status === 401 || error?.status === 404 || error?.status === 400) {
      return false;
    }
    
    return true;
  }

  private onFailure(error: any) {
    // Filtrer les erreurs
    if (!this.shouldCountAsFailure(error)) {
      console.log(`[Circuit Breaker: ${this.name}] Erreur ignorée:`, error?.status || error?.message);
      return; // Ne pas incrémenter le compteur
    }
    
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    console.warn(`[Circuit Breaker: ${this.name}] Échec ${this.failureCount}/${this.threshold}:`, error?.message);

    // Si en HALF_OPEN et échec, revenir immédiatement à OPEN
    if (this.state === 'HALF_OPEN') {
      this.setState('OPEN');
      return;
    }

    // Si trop d'échecs, passer en OPEN
    if (this.failureCount >= this.threshold) {
      this.setState('OPEN');
    }
  }

  private setState(newState: CircuitState) {
    if (this.state !== newState) {
      console.log(`[Circuit Breaker: ${this.name}] ${this.state} -> ${newState}`);
      this.state = newState;
      this.onStateChange?.(newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      threshold: this.threshold
    };
  }

  getDetailedStats() {
    return {
      ...this.getStats(),
      nextRetryTime: this.state === 'OPEN' 
        ? new Date(this.lastFailureTime + this.timeout).toISOString()
        : null,
      timeUntilRetry: this.state === 'OPEN'
        ? Math.max(0, this.timeout - (Date.now() - this.lastFailureTime))
        : 0,
      isAvailable: this.state !== 'OPEN'
    };
  }

  forceState(newState: CircuitState) {
    if (import.meta.env.DEV) {
      this.setState(newState);
      console.log(`🔧 [DEBUG] Circuit breaker forcé à ${newState}`);
    }
  }

  reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenAttempts = 0;
    this.setState('CLOSED');
  }
}

/**
 * Circuit Breaker pour Supabase
 */
export const supabaseCircuitBreaker = new CircuitBreaker(
  'Supabase',
  15,    // 15 erreurs au lieu de 5 (plus tolérant)
  30000, // 30 secondes au lieu de 60 (récupération plus rapide)
  3,     // 3 requêtes de test en HALF_OPEN
  (state) => {
    console.warn(`[Supabase Circuit Breaker] État changé: ${state}`);
    
    if (state === 'OPEN') {
      console.error('⚠️ Supabase circuit breaker OUVERT - Service temporairement indisponible');
      // Afficher un toast à l'utilisateur
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast({
          title: '⚠️ Connexion instable',
          description: 'Nous rencontrons des difficultés. Réessayez dans 30s.',
          variant: 'destructive'
        });
      }
    } else if (state === 'CLOSED') {
      console.log('✅ Supabase circuit breaker FERMÉ - Service rétabli');
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast({
          title: '✅ Connexion rétablie',
          description: 'Le service est de nouveau disponible.',
          variant: 'success'
        });
      }
    }
  }
);

/**
 * Wrapper pour fetch avec circuit breaker
 */
export async function fetchWithCircuitBreaker<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  return supabaseCircuitBreaker.execute(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  });
}

/**
 * Wrapper pour Supabase queries avec circuit breaker
 */
export async function supabaseWithCircuitBreaker<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  return supabaseCircuitBreaker.execute(async () => {
    const { data, error } = await queryFn();
    
    if (error) {
      throw error;
    }
    
    if (data === null) {
      throw new Error('No data returned from Supabase');
    }
    
    return data;
  });
}
