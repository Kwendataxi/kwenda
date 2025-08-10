// Configuration et initialisation globale des services
import { CountryService } from './countryConfig';
import { IPGeolocationService } from './ipGeolocation';

export class GlobalInitService {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🌍 Initialisation des services globaux...');

      // 1. Initialiser la détection de pays
      await this.initializeCountryDetection();

      // 2. Cache IP géolocalisation 
      await this.preloadIPLocation();

      // 3. Marquer comme initialisé
      this.initialized = true;
      console.log('✅ Services globaux initialisés');

    } catch (error) {
      console.error('❌ Erreur initialisation services:', error);
    }
  }

  private static async initializeCountryDetection(): Promise<void> {
    try {
      // Essayer de détecter le pays via IP
      const country = await IPGeolocationService.detectCountryFromIP();
      
      if (country) {
        // Mettre à jour le pays actuel
        if (country.includes('Congo') || country.includes('RDC')) {
          CountryService.setCurrentCountry('CD');
        } else if (country.includes('Ivoire') || country.includes('Côte')) {
          CountryService.setCurrentCountry('CI');
        }
      }
    } catch (error) {
      console.warn('Détection pays via IP échouée:', error);
      // Garder RDC par défaut
    }
  }

  private static async preloadIPLocation(): Promise<void> {
    try {
      // Pré-charger la localisation IP en arrière-plan
      await IPGeolocationService.getLocationFromIP();
    } catch (error) {
      console.warn('Préchargement IP location échoué:', error);
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