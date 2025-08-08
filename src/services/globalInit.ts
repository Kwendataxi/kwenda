import { CountryService } from './countryConfig';
import { IPGeolocationService } from './ipGeolocation';

export class GlobalInitService {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing global location services...');
      
      // Try to detect country from IP as fallback
      const detectedCountry = await IPGeolocationService.detectCountryFromIP();
      CountryService.setCurrentCountry(detectedCountry);
      
      console.log('Global services initialized with country:', detectedCountry);
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize global services:', error);
      // Use default country (RDC/Kinshasa)
      CountryService.setCurrentCountry('CD');
      this.initialized = true;
    }
  }

  static async updateLocationContext(latitude: number, longitude: number): Promise<void> {
    try {
      // Auto-detect country from coordinates
      await CountryService.autoDetectAndSetCountry(latitude, longitude);
    } catch (error) {
      console.warn('Failed to update location context:', error);
    }
  }
}