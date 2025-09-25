// Service de géolocalisation IP avec fallbacks multiples

interface IPLocationResult {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  accuracy: number;
  provider: string;
}

export class IPGeolocationService {
  private static instance: IPGeolocationService;
  private cache: IPLocationResult | null = null;
  private cacheExpiry: number = 0;

  static getInstance(): IPGeolocationService {
    if (!this.instance) {
      this.instance = new IPGeolocationService();
    }
    return this.instance;
  }

  async getCurrentLocation(): Promise<IPLocationResult> {
    // Cache réduit à 5 minutes pour permettre re-détection
    if (this.cache && Date.now() < this.cacheExpiry) {
      console.log('🏠 Using cached IP location:', this.cache);
      return this.cache;
    }

    console.log('🌍 Detecting IP location...');

    try {
      // Essayer plusieurs providers avec timeout
      const promises = [
        this.timeoutPromise(this.getLocationFromIPAPI(), 3000),
        this.timeoutPromise(this.getLocationFromIPInfo(), 3000),
        this.timeoutPromise(this.getLocationFromGeoJS(), 3000)
      ];

      // Prendre le premier résultat réussi
      const result = await Promise.race(promises.map(p => p.catch(err => err)))
        .then(result => {
          if (result instanceof Error) throw result;
          return result;
        });
      console.log('✅ IP location detected:', result);
      this.cache = result;
      this.cacheExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
      return result;
    } catch (error) {
      console.warn('❌ All IP geolocation services failed:', error);
      return this.getFallbackLocation();
    }
  }

  private timeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }

  private async getLocationFromIPAPI(): Promise<IPLocationResult> {
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    } as any);
    
    if (!response.ok) throw new Error('IPAPI failed');
    
    const data = await response.json();
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown',
      accuracy: 10000, // IP est moins précis
      provider: 'ipapi.co'
    };
  }

  private async getLocationFromIPInfo(): Promise<IPLocationResult> {
    const response = await fetch('https://ipinfo.io/json', {
      timeout: 5000
    } as any);
    
    if (!response.ok) throw new Error('IPInfo failed');
    
    const data = await response.json();
    const [lat, lng] = data.loc.split(',').map(Number);
    
    return {
      latitude: lat,
      longitude: lng,
      city: data.city || 'Unknown',
      country: data.country || 'Unknown',
      accuracy: 15000,
      provider: 'ipinfo.io'
    };
  }

  private async getLocationFromIPStack(): Promise<IPLocationResult> {
    // Note: Nécessite une clé API pour IPStack
    const response = await fetch('http://api.ipstack.com/check?access_key=demo', {
      timeout: 5000
    } as any);
    
    if (!response.ok) throw new Error('IPStack failed');
    
    const data = await response.json();
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown',
      accuracy: 12000,
      provider: 'ipstack.com'
    };
  }

  private async getLocationFromGeoJS(): Promise<IPLocationResult> {
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          city: data.city || 'Unknown',
          country: data.country || 'Unknown',
          accuracy: 30000,
          provider: 'geojs'
        };
      }
      throw new Error('Invalid response from GeoJS');
    } catch (error) {
      console.error('GeoJS geolocation failed:', error);
      throw error;
    }
  }

  private getFallbackLocation(): IPLocationResult {
    // Fallback Kinshasa pour RDC
    return {
      latitude: -4.3217,
      longitude: 15.3069,
      city: 'Kinshasa',
      country: 'République Démocratique du Congo',
      accuracy: 50000,
      provider: 'fallback'
    };
  }

  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  getCachedLocation(): IPLocationResult | null {
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }
    return null;
  }

  // Méthodes pour compatibilité
  static async getLocationFromIP(): Promise<IPLocationResult> {
    return this.getInstance().getCurrentLocation();
  }

  static async detectCountryFromIP(): Promise<string> {
    const location = await this.getInstance().getCurrentLocation();
    return location.country;
  }
}

export const ipGeolocation = IPGeolocationService.getInstance();