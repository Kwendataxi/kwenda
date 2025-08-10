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
    // Vérifier le cache (valide 1 heure)
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      // Essayer plusieurs providers en parallèle
      const results = await Promise.allSettled([
        this.getLocationFromIPAPI(),
        this.getLocationFromIPInfo(),
        this.getLocationFromIPStack()
      ]);

      // Prendre le premier résultat réussi
      for (const result of results) {
        if (result.status === 'fulfilled') {
          this.cache = result.value;
          this.cacheExpiry = Date.now() + (60 * 60 * 1000); // 1 heure
          return result.value;
        }
      }

      throw new Error('Tous les services IP ont échoué');
    } catch (error) {
      console.error('IP Geolocation failed:', error);
      return this.getFallbackLocation();
    }
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