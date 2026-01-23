import { supabase } from '@/integrations/supabase/client';

export interface GoogleMapsConfig {
  apiKey: string;
  mapId: string;
  libraries: string[];
}

class GoogleMapsLoaderService {
  private static instance: GoogleMapsLoaderService;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private apiKey: string | null = null;
  private mapId: string | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {}

  static getInstance(): GoogleMapsLoaderService {
    if (!GoogleMapsLoaderService.instance) {
      GoogleMapsLoaderService.instance = new GoogleMapsLoaderService();
    }
    return GoogleMapsLoaderService.instance;
  }

  async getApiKey(): Promise<string> {
    if (this.apiKey) {
      console.log('✅ Using cached Google Maps API key');
      return this.apiKey;
    }

    try {
      console.log('🔑 Fetching Google Maps API key from Supabase...');
      
      // Préparer les headers - authentification optionnelle
      const headers: Record<string, string> = {};
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          console.log('🔐 Using authenticated request for API key');
        } else {
          console.log('🔓 Using unauthenticated request for API key');
        }
      } catch (authError) {
        console.warn('⚠️ Auth check failed, proceeding without auth:', authError);
      }

      const { data, error } = await supabase.functions.invoke('get-google-maps-key', {
        headers: Object.keys(headers).length > 0 ? headers : undefined
      });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }
      
      if (!data?.apiKey) {
        console.error('❌ No API key in response:', data);
        throw new Error('No API key returned');
      }

      // MapId est optionnel - utiliser une valeur par défaut si absent
      const mapId = data?.mapId || 'DEMO_MAP_ID';
      
      console.log('✅ Google Maps API key received:', data.apiKey.substring(0, 15) + '...');
      console.log('✅ Google Maps Map ID received:', mapId);
      console.log('✅ Auth mode:', data.authenticated ? 'authenticated' : 'ip-based');
      
      this.apiKey = data.apiKey;
      this.mapId = mapId;
      return this.apiKey;
    } catch (error) {
      console.error('❌ Failed to fetch Google Maps API key:', error);
      
      // Retry avec exponential backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000;
        console.log(`⏳ Retrying in ${delay/1000}s... (attempt ${this.retryCount}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getApiKey();
      }
      
      throw new Error('Unable to load Google Maps API key after multiple attempts');
    }
  }

  getMapId(): string | null {
    return this.mapId;
  }

  async load(libraries: string[] = ['places', 'marker', 'geometry']): Promise<void> {
    // Si déjà chargé, retourner immédiatement
    if (this.isLoaded && window.google?.maps?.Map) {
      console.log('✅ Google Maps already loaded and ready');
      return Promise.resolve();
    }

    // Si le chargement est en cours, retourner la promesse existante
    if (this.loadPromise) {
      console.log('⏳ Google Maps loading in progress, waiting...');
      return this.loadPromise;
    }

    // Créer une nouvelle promesse de chargement
    this.loadPromise = this.loadScript(libraries);
    return this.loadPromise;
  }

  private async loadScript(libraries: string[]): Promise<void> {
    try {
      // Vérifier si le script est déjà présent et initialisé
      if (window.google?.maps?.Map && typeof window.google.maps.Map === 'function') {
        console.log('✅ Google Maps already loaded');
        this.isLoaded = true;
        return;
      }

      console.log('📥 Loading Google Maps script...');
      
      // Récupérer la clé API
      const apiKey = await this.getApiKey();
      console.log('🔑 API key obtained, creating script tag...');

      // Supprimer les anciens scripts Google Maps si présents
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => {
        console.log('🗑️ Removing old Google Maps script');
        script.remove();
      });

      // Créer et insérer le script avec loading=async
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const librariesParam = libraries.join(',');
        
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${librariesParam}&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;
        script.id = 'google-maps-script';

        script.onload = async () => {
          try {
            console.log('📦 Google Maps script loaded, waiting for initialization...');
            // Attendre que google.maps soit complètement initialisé
            await this.waitForMapsLibrary();
            this.isLoaded = true;
            this.retryCount = 0; // Reset retry count on success
            console.log('✅ Google Maps API loaded successfully');
            resolve();
          } catch (err) {
            console.error('❌ Error during Maps initialization:', err);
            this.loadPromise = null;
            reject(err);
          }
        };

        script.onerror = (e) => {
          console.error('❌ Failed to load Google Maps script:', e);
          this.loadPromise = null;
          reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      this.loadPromise = null;
      throw error;
    }
  }

  private async waitForMapsLibrary(): Promise<void> {
    // Attendre que google.maps.importLibrary soit disponible
    const maxWait = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (!window.google?.maps?.importLibrary) {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Timeout waiting for Google Maps importLibrary');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Importer la bibliothèque 'maps' pour s'assurer que Map est un constructeur
    try {
      await window.google.maps.importLibrary('maps');
      await window.google.maps.importLibrary('marker');
      
      // ✅ Polling robuste pour vérifier que Map est bien un constructeur
      const maxAttempts = 30;
      const delayMs = 100;
      
      for (let i = 0; i < maxAttempts; i++) {
        if (typeof window.google.maps.Map === 'function') {
          // Double vérification avec le prototype
          if (window.google.maps.Map.prototype?.constructor) {
            console.log('✅ google.maps.Map is ready as a constructor');
            return;
          }
        }
        
        // Attendre avant la prochaine vérification
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      throw new Error('google.maps.Map is not a constructor after waiting');
    } catch (error) {
      console.error('Error importing maps library:', error);
      throw error;
    }
  }

  isScriptLoaded(): boolean {
    return this.isLoaded && !!window.google?.maps?.Map;
  }

  // Reset pour forcer un rechargement
  reset(): void {
    this.loadPromise = null;
    this.isLoaded = false;
    this.apiKey = null;
    this.mapId = null;
    this.retryCount = 0;
  }
}

export const googleMapsLoader = GoogleMapsLoaderService.getInstance();
