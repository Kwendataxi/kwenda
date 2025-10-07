import { supabase } from '@/integrations/supabase/client';
import { googleMapsSecurityService } from './googleMapsSecurityService';

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
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }
      
      if (!data?.apiKey) {
        console.error('❌ No API key in response:', data);
        throw new Error('No API key returned');
      }

      if (!data?.mapId) {
        console.error('❌ No Map ID in response:', data);
        throw new Error('No Map ID returned');
      }
      
      console.log('✅ Google Maps API key received:', data.apiKey.substring(0, 10) + '...');
      console.log('✅ Google Maps Map ID received:', data.mapId);
      this.apiKey = data.apiKey;
      this.mapId = data.mapId;
      return this.apiKey;
    } catch (error) {
      console.error('❌ Failed to fetch Google Maps API key:', error);
      throw new Error('Unable to load Google Maps API key');
    }
  }

  getMapId(): string | null {
    return this.mapId;
  }

  async load(libraries: string[] = ['places', 'marker', 'geometry']): Promise<void> {
    // Si déjà chargé, retourner immédiatement
    if (this.isLoaded && window.google?.maps?.Map) {
      return Promise.resolve();
    }

    // Si le chargement est en cours, retourner la promesse existante
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Créer une nouvelle promesse de chargement
    this.loadPromise = this.loadScript(libraries);
    return this.loadPromise;
  }

  private async loadScript(libraries: string[]): Promise<void> {
    try {
      // Vérifier si le script est déjà présent et initialisé
      if (window.google?.maps?.Map) {
        console.log('✅ Google Maps already loaded');
        this.isLoaded = true;
        return;
      }

      console.log('📥 Loading Google Maps script...');
      
      // Récupérer la clé API
      const apiKey = await this.getApiKey();
      console.log('🔑 API key obtained, creating script tag...');

      // Créer et insérer le script avec loading=async
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const librariesParam = libraries.join(',');
        
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${librariesParam}&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = async () => {
          try {
            console.log('📦 Google Maps script loaded, waiting for initialization...');
            // Attendre que google.maps soit complètement initialisé
            await this.waitForMapsLibrary();
            this.isLoaded = true;
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
    if (!window.google?.maps?.importLibrary) {
      throw new Error('Google Maps API not properly loaded');
    }

    // Importer la bibliothèque 'maps' pour s'assurer que Map est un constructeur
    try {
      await window.google.maps.importLibrary('maps');
      
      // ✅ Polling robuste pour vérifier que Map est bien un constructeur
      const maxAttempts = 20;
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
}

export const googleMapsLoader = GoogleMapsLoaderService.getInstance();
