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
    // Si circuit ouvert, vérifier si on peut passer en HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.setState('HALF_OPEN');
        this.successCount = 0;
        this.halfOpenAttempts = 0;
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN. Retry after ${Math.ceil((this.timeout - (Date.now() - this.lastFailureTime)) / 1000)}s`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
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

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

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
  5,     // 5 erreurs
  60000, // 1 minute timeout
  3,     // 3 requêtes de test en HALF_OPEN
  (state) => {
    console.warn(`[Supabase Circuit Breaker] État changé: ${state}`);
    
    // Logger dans analytics
    if (state === 'OPEN') {
      console.error('⚠️ Supabase circuit breaker OUVERT - Service temporairement indisponible');
    } else if (state === 'CLOSED') {
      console.log('✅ Supabase circuit breaker FERMÉ - Service rétabli');
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
