/**
 * 💾 SESSION RECOVERY - LAYER 3: SAUVEGARDE ET RESTAURATION AUTOMATIQUE
 * Persiste l'état utilisateur pour recovery après crash/reload
 */

export interface SessionBackup {
  user: any;
  activeBooking: any;
  cartItems: any[];
  formData: Record<string, any>;
  lastRoute: string;
  timestamp: number;
  appState: Record<string, any>;
}

export class SessionRecovery {
  private backupInterval: NodeJS.Timeout | null = null;
  private autoSaveEnabled = true;
  private readonly BACKUP_KEY = 'kwenda_session_backup';
  private readonly MAX_AGE = 300000; // 5 minutes

  constructor() {
    this.startAutoSave();
  }

  private startAutoSave() {
    // Sauvegarde automatique toutes les 30 secondes
    this.backupInterval = setInterval(() => {
      if (this.autoSaveEnabled) {
        this.saveCurrentState();
      }
    }, 30000);

    // Sauvegarde au beforeunload
    window.addEventListener('beforeunload', () => {
      this.saveCurrentState();
    });
  }

  public saveCurrentState() {
    try {
      const backup: SessionBackup = {
        user: this.getUserData(),
        activeBooking: this.getActiveBooking(),
        cartItems: this.getCartItems(),
        formData: this.getFormData(),
        lastRoute: window.location.pathname,
        timestamp: Date.now(),
        appState: this.getAppState()
      };

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
      
      if (import.meta.env.DEV) {
        console.log('💾 [SessionRecovery] État sauvegardé');
      }
    } catch (error) {
      console.error('Erreur sauvegarde session:', error);
    }
  }

  private getUserData() {
    try {
      // Récupérer données utilisateur du localStorage
      const userStr = localStorage.getItem('kwenda_user_cache');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  private getActiveBooking() {
    try {
      // Récupérer la commande en cours
      const bookingStr = localStorage.getItem('kwenda_active_booking');
      return bookingStr ? JSON.parse(bookingStr) : null;
    } catch {
      return null;
    }
  }

  private getCartItems() {
    try {
      const cartStr = localStorage.getItem('kwenda_cart');
      return cartStr ? JSON.parse(cartStr) : [];
    } catch {
      return [];
    }
  }

  private getFormData() {
    try {
      // Récupérer les formulaires incomplets
      const forms: Record<string, any> = {};
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('form_')) {
          const value = sessionStorage.getItem(key);
          if (value) {
            forms[key] = JSON.parse(value);
          }
        }
      }
      
      return forms;
    } catch {
      return {};
    }
  }

  private getAppState() {
    try {
      return {
        theme: localStorage.getItem('kwenda_theme'),
        language: localStorage.getItem('kwenda_language'),
        lastCity: localStorage.getItem('kwenda_last_city'),
        preferences: localStorage.getItem('kwenda_user_preferences')
      };
    } catch {
      return {};
    }
  }

  public getBackup(): SessionBackup | null {
    try {
      const backupStr = localStorage.getItem(this.BACKUP_KEY);
      if (!backupStr) return null;

      const backup: SessionBackup = JSON.parse(backupStr);
      
      // Vérifier si le backup est récent
      const age = Date.now() - backup.timestamp;
      if (age > this.MAX_AGE) {
        console.log('⏰ Backup trop ancien, ignoré');
        this.clearBackup();
        return null;
      }

      return backup;
    } catch (error) {
      console.error('Erreur lecture backup:', error);
      return null;
    }
  }

  public async restoreSession(): Promise<boolean> {
    const backup = this.getBackup();
    if (!backup) return false;

    console.log('🔄 [SessionRecovery] Restauration de la session...');

    try {
      // Restaurer les données utilisateur
      if (backup.user) {
        localStorage.setItem('kwenda_user_cache', JSON.stringify(backup.user));
      }

      // Restaurer la commande en cours
      if (backup.activeBooking) {
        localStorage.setItem('kwenda_active_booking', JSON.stringify(backup.activeBooking));
      }

      // Restaurer le panier
      if (backup.cartItems && backup.cartItems.length > 0) {
        localStorage.setItem('kwenda_cart', JSON.stringify(backup.cartItems));
      }

      // Restaurer les formulaires
      Object.entries(backup.formData).forEach(([key, value]) => {
        sessionStorage.setItem(key, JSON.stringify(value));
      });

      // Restaurer l'état global
      if (backup.appState.theme) {
        localStorage.setItem('kwenda_theme', backup.appState.theme);
      }
      if (backup.appState.language) {
        localStorage.setItem('kwenda_language', backup.appState.language);
      }

      // Naviguer vers la dernière route (optionnel)
      if (backup.lastRoute && backup.lastRoute !== '/' && backup.lastRoute !== window.location.pathname) {
        console.log('📍 Redirection vers:', backup.lastRoute);
        window.history.replaceState(null, '', backup.lastRoute);
      }

      console.log('✅ Session restaurée avec succès');
      
      // Nettoyer le backup après restauration réussie
      this.clearBackup();
      
      return true;
    } catch (error) {
      console.error('Erreur restauration session:', error);
      return false;
    }
  }

  public clearBackup() {
    localStorage.removeItem(this.BACKUP_KEY);
  }

  public disableAutoSave() {
    this.autoSaveEnabled = false;
  }

  public enableAutoSave() {
    this.autoSaveEnabled = true;
  }

  public cleanup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
  }
}

// Instance singleton
export const sessionRecovery = new SessionRecovery();
