/**
 * Utilitaires pour les téléchargements et installation PWA
 */

// Interface pour l'événement beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstallable = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Écouter l'événement beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      // Empêcher l'affichage automatique du prompt
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
    });

    // Détecter si l'app est déjà installée
    window.addEventListener('appinstalled', () => {
      console.log('PWA installée avec succès');
      this.deferredPrompt = null;
      this.isInstallable = false;
    });
  }

  // Vérifier si l'installation PWA est possible
  canInstall(): boolean {
    return this.isInstallable && this.deferredPrompt !== null;
  }

  // Déclencher l'installation PWA
  async installPWA(): Promise<boolean> {
    if (!this.canInstall() || !this.deferredPrompt) {
      return false;
    }

    try {
      // Afficher le prompt d'installation
      await this.deferredPrompt.prompt();
      
      // Attendre la réponse de l'utilisateur
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Utilisateur a accepté l\'installation PWA');
        this.deferredPrompt = null;
        this.isInstallable = false;
        return true;
      } else {
        console.log('Utilisateur a refusé l\'installation PWA');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation PWA:', error);
      return false;
    }
  }

  // Détecter si l'application est en mode standalone (installée)
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Détecter le type d'appareil
  getDeviceType(): 'ios' | 'android' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else {
      return 'desktop';
    }
  }

  // Instructions spécifiques pour iOS Safari
  getIOSInstallInstructions(): string {
    return 'Pour installer Kwenda Taxi sur iOS: Appuyez sur le bouton Partager puis "Ajouter à l\'écran d\'accueil"';
  }

  // Rediriger vers les stores appropriés ou afficher message d'attente
  redirectToStore() {
    const deviceType = this.getDeviceType();
    
    switch (deviceType) {
      case 'ios':
        this.showComingSoonMessage('iOS App Store');
        break;
      case 'android':
        this.showComingSoonMessage('Google Play Store');
        break;
      default:
        // Pour desktop, utiliser la PWA
        if (this.canInstall()) {
          this.installPWA();
        } else {
          // Rediriger vers l'application web
          window.location.href = '/auth';
        }
        break;
    }
  }

  // Afficher un message élégant pour les apps en cours de publication
  private showComingSoonMessage(storeName: string) {
    const message = `🚀 Kwenda Taxi arrive bientôt sur ${storeName}!\n\nEn attendant, utilisez notre version web complète en cliquant sur "Utiliser l'app web" sur la page d'accueil.`;
    
    if (confirm(message + '\n\nVoulez-vous être redirigé vers l\'application web ?')) {
      window.location.href = '/auth';
    }
  }
}

// Instance globale
export const pwaInstaller = new PWAInstaller();

// Fonction helper pour gérer les téléchargements avec gestion élégante des apps en publication
export const handleDownload = (platform: 'android' | 'ios' | 'web') => {
  switch (platform) {
    case 'android':
      showAppComingSoon('Google Play Store');
      break;
    case 'ios':
      showAppComingSoon('iOS App Store');
      break;
    case 'web':
      if (pwaInstaller.canInstall()) {
        pwaInstaller.installPWA();
      } else {
        // Fallback: rediriger vers l'application
        window.location.href = '/auth';
      }
      break;
  }
};

// Fonction helper pour afficher un message d'attente élégant
const showAppComingSoon = (storeName: string) => {
  const message = `🚀 Kwenda Taxi arrive bientôt sur ${storeName}!\n\nNotre équipe finalise la soumission aux stores. En attendant, profitez de notre version web complète qui offre toutes les fonctionnalités.`;
  
  if (confirm(message + '\n\nVoulez-vous accéder à l\'application web ?')) {
    window.location.href = '/auth';
  }
};