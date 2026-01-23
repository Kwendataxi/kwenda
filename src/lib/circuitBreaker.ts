/**
 * CIRCUIT BREAKER PATTERN - PHASE 9 OPTIMISÉ
 * Seuils augmentés pour éviter les blocages intempestifs
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;

  constructor(
    private name: string,
    private threshold: number = 25, // 🔧 25 au lieu de 5
    private timeout: number = 15000, // 🔧 15s au lieu de 60s
    private halfOpenRequests: number = 3,
    private onStateChange?: (state: CircuitState) => void
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const timeLeft = Math.ceil((this.timeout - (Date.now() - this.lastFailureTime)) / 1000);
      
      if (Date.now() - this.lastFailureTime > this.timeout) {
        console.log(`🔄 [Circuit: ${this.name}] Recovering (HALF_OPEN)`);
        this.setState('HALF_OPEN');
        this.successCount = 0;
        this.halfOpenAttempts = 0;
      } else {
        throw new Error(`Circuit [${this.name}] OPEN. Retry in ${timeLeft}s`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      this.halfOpenAttempts++;

      if (this.successCount >= this.halfOpenRequests) {
        this.setState('CLOSED');
      }
    }
  }

  private shouldCountAsFailure(error: any): boolean {
    // 🔧 NE PAS compter AbortError comme échec critique
    if (error?.name === 'AbortError' || error?.message?.includes('AbortError')) {
      console.log(`[Circuit: ${this.name}] AbortError ignored`);
      return false;
    }

    // Timeout = échec uniquement si répété
    if (error?.message?.includes('timeout')) {
      return true;
    }
    
    // Erreur serveur 5xx = échec
    if (error?.status >= 500) {
      return true;
    }
    
    // 401, 404, 400 = erreurs normales, ignorer
    if (error?.status === 401 || error?.status === 404 || error?.status === 400) {
      return false;
    }
    
    return true;
  }

  private onFailure(error: any) {
    if (!this.shouldCountAsFailure(error)) {
      return;
    }
    
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    console.warn(`[Circuit: ${this.name}] Failure ${this.failureCount}/${this.threshold}`);

    if (this.state === 'HALF_OPEN') {
      this.setState('OPEN');
      return;
    }

    if (this.failureCount >= this.threshold) {
      this.setState('OPEN');
    }
  }

  private setState(newState: CircuitState) {
    if (this.state !== newState) {
      console.log(`[Circuit: ${this.name}] ${this.state} -> ${newState}`);
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
      threshold: this.threshold
    };
  }

  getDetailedStats() {
    return {
      ...this.getStats(),
      nextRetryTime: this.state === 'OPEN' 
        ? new Date(this.lastFailureTime + this.timeout).toISOString()
        : null,
      isAvailable: this.state !== 'OPEN'
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
 * Circuit Breaker pour Supabase - Seuils augmentés
 */
export const supabaseCircuitBreaker = new CircuitBreaker(
  'Supabase',
  25,    // 🔧 25 erreurs (plus tolérant)
  15000, // 🔧 15 secondes (récupération rapide)
  3,
  (state) => {
    if (state === 'OPEN') {
      console.error('⚠️ Supabase circuit OPEN - 15s cooldown');
    } else if (state === 'CLOSED') {
      console.log('✅ Supabase circuit CLOSED - Service restored');
    }
  }
);

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

export async function supabaseWithCircuitBreaker<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  return supabaseCircuitBreaker.execute(async () => {
    const { data, error } = await queryFn();
    if (error) throw error;
    if (data === null) throw new Error('No data returned');
    return data;
  });
}
