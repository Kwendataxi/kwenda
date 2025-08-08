interface IPGeolocationResponse {
  country: string;
  countryCode: string;
  regionName: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  currency: string;
  status: string;
}

export class IPGeolocationService {
  private static cache: IPGeolocationResponse | null = null;
  private static lastFetch = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async detectCountryFromIP(): Promise<string> {
    try {
      // Use cached result if available and fresh
      if (this.cache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        return this.cache.countryCode;
      }

      // Use free IP geolocation service with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://ip-api.com/json/', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch IP geolocation');
      }

      const data: IPGeolocationResponse = await response.json();
      
      if (data.status === 'success') {
        this.cache = data;
        this.lastFetch = Date.now();
        
        console.log('Detected country from IP:', data.countryCode, data.country);
        return data.countryCode;
      } else {
        throw new Error('IP geolocation service returned error');
      }
    } catch (error) {
      console.warn('Failed to detect country from IP:', error);
      // No forced fallback - let the system handle it properly
      return 'UNKNOWN';
    }
  }

  static async getLocationFromIP(): Promise<{ lat: number; lng: number } | null> {
    try {
      if (this.cache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        return { lat: this.cache.lat, lng: this.cache.lon };
      }

      const countryCode = await this.detectCountryFromIP();
      return this.cache ? { lat: this.cache.lat, lng: this.cache.lon } : null;
    } catch (error) {
      console.warn('Failed to get location from IP:', error);
      return null;
    }
  }
}