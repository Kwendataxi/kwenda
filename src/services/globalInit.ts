// Configuration et initialisation globale des services
import { CountryService } from './countryConfig';
import { IPGeolocationService } from './ipGeolocation';

export class GlobalInitService {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🌍 Initialisation des services globaux...');

      // 1. Initialiser la détection de pays (critique)
      this.initializeCountryDetectionSync();

      // 2. Marquer comme initialisé immédiatement
      this.initialized = true;
      console.log('✅ Services critiques initialisés');

      // 3. Charger IP géolocalisation en arrière-plan (non-bloquant)
      this.preloadIPLocationBackground();

    } catch (error) {
      console.error('❌ Erreur initialisation services:', error);
      this.initialized = true; // Continuer quand même
    }
  }

  private static initializeCountryDetectionSync(): void {
    // Utiliser le localStorage en premier pour éviter le réseau
    const cachedCountry = localStorage.getItem('kwenda_country');
    if (cachedCountry) {
      CountryService.setCurrentCountry(cachedCountry as 'CD' | 'CI');
      console.log(`📍 Pays chargé depuis cache: ${cachedCountry}`);
    } else {
      // Défaut RDC
      CountryService.setCurrentCountry('CD');
    }

    // Détecter en arrière-plan
    this.detectCountryBackground();
  }

  private static detectCountryBackground(): void {
    if (typeof window === 'undefined') return;

    // Utiliser requestIdleCallback pour ne pas bloquer
    const callback = async () => {
      try {
        const country = await IPGeolocationService.detectCountryFromIP();
        
        if (country) {
          let countryCode: 'CD' | 'CI' = 'CD';
          if (country.includes('Congo') || country.includes('RDC')) {
            countryCode = 'CD';
          } else if (country.includes('Ivoire') || country.includes('Côte')) {
            countryCode = 'CI';
          }
          
          CountryService.setCurrentCountry(countryCode);
          localStorage.setItem('kwenda_country', countryCode);
          console.log(`🌍 Pays détecté: ${countryCode}`);
        }
      } catch (error) {
        console.warn('Détection pays en arrière-plan échouée:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 5000 });
    } else {
      setTimeout(callback, 2000);
    }
  }

  private static preloadIPLocationBackground(): void {
    if (typeof window === 'undefined') return;

    // Cache localStorage (1 heure)
    const CACHE_KEY = 'kwenda_ip_location';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          console.log('📍 IP location chargée depuis cache');
          return;
        }
      } catch (e) {
        // Cache invalide
      }
    }

    // Charger en arrière-plan
    const callback = async () => {
      try {
        const location = await IPGeolocationService.getLocationFromIP();
        if (location) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            location,
            timestamp: Date.now()
          }));
          console.log('📍 IP location mise en cache');
        }
      } catch (error) {
        console.warn('Préchargement IP location échoué:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 10000 });
    } else {
      setTimeout(callback, 5000);
    }
  }

  static async updateLocationContext(latitude: number, longitude: number): Promise<void> {
    try {
      // Auto-detect country from coordinates
      CountryService.autoDetectAndSetCountry(latitude, longitude);
    } catch (error) {
      console.warn('Failed to update location context:', error);
    }
  }

  static isInitialized(): boolean {
    return this.initialized;
  }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
  GlobalInitService.initialize();
}