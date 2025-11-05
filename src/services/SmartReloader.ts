/**
 * 🔄 SMART RELOADER - LAYER 3: RECHARGEMENT INTELLIGENT
 * Reload automatique avec sauvegarde d'état et timing intelligent
 */

export interface ReloadReason {
  type: 'crash' | 'memory' | 'update' | 'recovery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export class SmartReloader {
  private reloadScheduled = false;
  private reloadTimeout: NodeJS.Timeout | null = null;

  public scheduleReload(reason: ReloadReason, delayMs: number = 3000) {
    if (this.reloadScheduled) {
      console.log('⏳ Reload déjà planifié, ignoré');
      return;
    }

    this.reloadScheduled = true;
    
    console.log(`🔄 [SmartReloader] Reload planifié: ${reason.message} (${delayMs}ms)`);

    // Sauvegarder l'état avant reload
    this.saveStateBeforeReload(reason);

    // Notifier l'utilisateur
    this.notifyUser(reason, delayMs);

    // Planifier le reload
    this.reloadTimeout = setTimeout(() => {
      this.performReload();
    }, delayMs);
  }

  public scheduleReloadWhenIdle() {
    console.log('⏰ [SmartReloader] Reload planifié en inactivité...');

    let idleTime = 0;
    const checkInterval = setInterval(() => {
      idleTime += 1000;

      // Reload après 5 minutes d'inactivité
      if (idleTime >= 300000) {
        clearInterval(checkInterval);
        this.scheduleReload({
          type: 'memory',
          severity: 'medium',
          message: 'Optimisation en arrière-plan'
        }, 1000);
      }
    }, 1000);

    // Reset idle time sur activité
    const resetIdle = () => {
      idleTime = 0;
    };

    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdle, { once: true, passive: true });
    });
  }

  private saveStateBeforeReload(reason: ReloadReason) {
    try {
      const state = {
        reason: reason.type,
        severity: reason.severity,
        message: reason.message,
        timestamp: Date.now(),
        url: window.location.href,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        }
      };

      sessionStorage.setItem('kwenda_reload_state', JSON.stringify(state));
      console.log('💾 État sauvegardé avant reload');
    } catch (error) {
      console.error('Erreur sauvegarde état:', error);
    }
  }

  private notifyUser(reason: ReloadReason, delayMs: number) {
    const messages = {
      crash: '🔄 Redémarrage pour corriger une erreur...',
      memory: '🧹 Optimisation de la mémoire en cours...',
      update: '⬆️ Mise à jour disponible, redémarrage...',
      recovery: '🛡️ Récupération automatique en cours...'
    };

    const message = messages[reason.type] || 'Redémarrage...';
    
    // Créer une notification discrète
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="animate-spin">⚙️</div>
        <div>
          <div class="font-medium">${message}</div>
          <div class="text-sm opacity-80">${Math.ceil(delayMs / 1000)}s</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);

    // Retirer après le reload
    setTimeout(() => {
      notification.remove();
    }, delayMs);
  }

  private performReload() {
    console.log('🔄 [SmartReloader] Reload NOW');
    
    try {
      // Hard reload pour nettoyer tout le cache
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors du reload:', error);
      // Fallback
      window.location.href = window.location.href;
    }
  }

  public cancelReload() {
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
      this.reloadTimeout = null;
      this.reloadScheduled = false;
      console.log('❌ Reload annulé');
    }
  }

  public checkReloadState() {
    try {
      const stateStr = sessionStorage.getItem('kwenda_reload_state');
      if (!stateStr) return null;

      const state = JSON.parse(stateStr);
      
      // Nettoyer l'état
      sessionStorage.removeItem('kwenda_reload_state');
      
      // Vérifier si reload récent (< 10 secondes)
      if (Date.now() - state.timestamp < 10000) {
        console.log('✅ [SmartReloader] Reload réussi:', state.message);
        
        // Restaurer la position de scroll
        if (state.scrollPosition) {
          window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
        }
        
        return state;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lecture reload state:', error);
      return null;
    }
  }

  public cleanup() {
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
    }
  }
}

// Instance singleton
export const smartReloader = new SmartReloader();
