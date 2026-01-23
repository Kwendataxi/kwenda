/**
 * 🏥 HEALTH MONITOR - LAYER 1: DÉTECTION PROACTIVE
 * Surveille les métriques critiques de l'application
 */

export interface HealthMetrics {
  memory: {
    current: number;
    trend: 'stable' | 'rising' | 'critical';
    percentage: number;
  };
  cpu: {
    blocked: boolean;
    lastBlockDuration: number;
  };
  network: {
    status: 'stable' | 'unstable' | 'offline';
    latency: number;
    lastCheck: number;
  };
  battery: {
    level: number;
    critical: boolean;
    charging: boolean;
  };
  apis: Record<string, {
    successRate: number;
    avgLatency: number;
    consecutiveFailures: number;
  }>;
  crashes: {
    total: number;
    byComponent: Record<string, number>;
    lastCrashTime: number;
  };
}

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'failing';

export class HealthMonitor {
  private metrics: HealthMetrics = {
    memory: { current: 0, trend: 'stable', percentage: 0 },
    cpu: { blocked: false, lastBlockDuration: 0 },
    network: { status: 'stable', latency: 0, lastCheck: Date.now() },
    battery: { level: 100, critical: false, charging: false },
    apis: {},
    crashes: { total: 0, byComponent: {}, lastCrashTime: 0 }
  };

  private memoryHistory: number[] = [];
  private listeners: Array<(metrics: HealthMetrics) => void> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitoring toutes les 60 secondes (optimisé pour réduire la charge CPU)
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.notifyListeners();
    }, 60000);

    // Monitoring immédiat au démarrage
    this.updateMetrics();
  }

  private async updateMetrics() {
    await Promise.all([
      this.checkMemory(),
      // CPU check désactivé car il cause des blocages UI
      this.checkNetwork(),
      this.checkBattery()
    ]);
  }

  private async checkMemory() {
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      const usedMB = mem.usedJSHeapSize / 1048576; // Convert to MB
      const totalMB = mem.jsHeapSizeLimit / 1048576;
      const percentage = (usedMB / totalMB) * 100;

      this.memoryHistory.push(usedMB);
      if (this.memoryHistory.length > 10) {
        this.memoryHistory.shift();
      }

      // Déterminer la tendance
      let trend: 'stable' | 'rising' | 'critical' = 'stable';
      if (this.memoryHistory.length >= 3) {
        const recent = this.memoryHistory.slice(-3);
        const isRising = recent.every((val, i) => i === 0 || val > recent[i - 1]);
        
        if (percentage > 85) {
          trend = 'critical';
        } else if (isRising && percentage > 70) {
          trend = 'rising';
        }
      }

      this.metrics.memory = {
        current: usedMB,
        trend,
        percentage
      };

      if (trend === 'critical') {
        console.warn('⚠️ [HealthMonitor] Mémoire critique:', percentage.toFixed(1) + '%');
      }
    }
  }

  private async checkCPU() {
    // Mesurer le temps de blocage avec un microtask
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 0));
    const duration = performance.now() - start;

    const blocked = duration > 100; // Bloqué si > 100ms
    
    if (blocked) {
      console.warn('⚠️ [HealthMonitor] CPU bloqué:', duration.toFixed(2) + 'ms');
    }

    this.metrics.cpu = {
      blocked,
      lastBlockDuration: duration
    };
  }

  private async checkNetwork() {
    const online = navigator.onLine;
    
    if (!online) {
      this.metrics.network = {
        status: 'offline',
        latency: -1,
        lastCheck: Date.now()
      };
      return;
    }

    // Mesurer latency avec un ping vers Supabase
    const start = performance.now();
    try {
      await fetch('https://wddlktajnhwhyquwcdgf.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      const latency = performance.now() - start;

      this.metrics.network = {
        status: latency > 2000 ? 'unstable' : 'stable',
        latency,
        lastCheck: Date.now()
      };
    } catch (error) {
      this.metrics.network = {
        status: 'unstable',
        latency: -1,
        lastCheck: Date.now()
      };
    }
  }

  private async checkBattery() {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        const level = battery.level * 100;
        
        this.metrics.battery = {
          level,
          critical: level < 10,
          charging: battery.charging
        };

        if (level < 10 && !battery.charging) {
          console.warn('⚠️ [HealthMonitor] Batterie critique:', level.toFixed(0) + '%');
        }
      } catch (error) {
        // Battery API non disponible
      }
    }
  }

  // API publiques
  public recordAPICall(endpoint: string, success: boolean, latency: number) {
    if (!this.metrics.apis[endpoint]) {
      this.metrics.apis[endpoint] = {
        successRate: 1,
        avgLatency: latency,
        consecutiveFailures: 0
      };
      return;
    }

    const api = this.metrics.apis[endpoint];
    
    // Update success rate (rolling average)
    const newSuccess = success ? 1 : 0;
    api.successRate = (api.successRate * 0.9) + (newSuccess * 0.1);
    
    // Update latency
    api.avgLatency = (api.avgLatency * 0.8) + (latency * 0.2);
    
    // Track consecutive failures
    if (success) {
      api.consecutiveFailures = 0;
    } else {
      api.consecutiveFailures++;
      
      if (api.consecutiveFailures >= 5) {
        console.error('🔴 [HealthMonitor] API en échec répété:', endpoint);
      }
    }
  }

  public recordCrash(componentName: string) {
    this.metrics.crashes.total++;
    this.metrics.crashes.lastCrashTime = Date.now();
    
    if (!this.metrics.crashes.byComponent[componentName]) {
      this.metrics.crashes.byComponent[componentName] = 0;
    }
    this.metrics.crashes.byComponent[componentName]++;

    console.error('💥 [HealthMonitor] Crash détecté:', componentName);
  }

  public getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  public getHealthStatus(): HealthStatus {
    const { memory, network, battery, crashes } = this.metrics;
    
    // Critical: Mémoire saturée OU multiples crashes récents
    const recentCrashes = crashes.lastCrashTime > Date.now() - 60000;
    if (memory.trend === 'critical' || (crashes.total >= 3 && recentCrashes)) {
      return 'critical';
    }
    
    // Failing: Réseau offline ET batterie critique
    if (network.status === 'offline' && battery.critical) {
      return 'failing';
    }
    
    // Degraded: Problèmes mais fonctionnel
    if (
      memory.percentage > 70 ||
      network.status === 'unstable' ||
      battery.critical ||
      crashes.total > 0
    ) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  public getHealthScore(): number {
    const { memory, network, battery, crashes, apis } = this.metrics;
    
    let score = 100;
    
    // Pénalités mémoire
    if (memory.trend === 'critical') score -= 40;
    else if (memory.trend === 'rising') score -= 20;
    else if (memory.percentage > 70) score -= 10;
    
    // Pénalités réseau
    if (network.status === 'offline') score -= 30;
    else if (network.status === 'unstable') score -= 15;
    
    // Pénalités batterie
    if (battery.critical && !battery.charging) score -= 20;
    else if (battery.level < 20) score -= 10;
    
    // Pénalités crashes
    score -= crashes.total * 10;
    
    // Pénalités APIs en échec
    Object.values(apis).forEach(api => {
      if (api.successRate < 0.5) score -= 15;
      else if (api.successRate < 0.8) score -= 5;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  public subscribe(listener: (metrics: HealthMetrics) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getMetrics());
      } catch (error) {
        console.error('[HealthMonitor] Erreur dans listener:', error);
      }
    });
  }

  public cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.listeners = [];
  }
}

// Instance singleton
export const healthMonitor = new HealthMonitor();
