/**
 * 🔊 PHASE 8: Audio Service pour Sons Personnalisés
 * Gestion centralisée des sons avec fallback
 */

class AudioService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled = true;

  /**
   * Précharger les sons au démarrage
   */
  async preloadSounds(): Promise<void> {
    const sounds = [
      { key: 'new_ride', path: '/sounds/new_ride.mp3' },
      { key: 'ride_accepted', path: '/sounds/ride_accepted.mp3' },
      { key: 'navigation_turn', path: '/sounds/navigation_turn.mp3' },
      { key: 'arrival', path: '/sounds/arrival.mp3' },
      { key: 'completed', path: '/sounds/completed.mp3' }
    ];

    for (const sound of sounds) {
      try {
        const audio = new Audio(sound.path);
        audio.preload = 'auto';
        this.audioCache.set(sound.key, audio);
      } catch (error) {
        console.log(`Sound ${sound.key} not available:`, error);
      }
    }

    console.log('🔊 Audio service initialized');
  }

  /**
   * Jouer un son
   */
  async play(soundKey: string, volume: number = 1.0, loop: boolean = false): Promise<void> {
    if (!this.enabled) return;

    try {
      const audio = this.audioCache.get(soundKey);
      
      if (audio) {
        audio.volume = volume;
        audio.loop = loop;
        audio.currentTime = 0; // Recommencer depuis le début
        await audio.play();
      } else {
        console.log(`Sound ${soundKey} not found in cache`);
      }
    } catch (error) {
      console.log(`Failed to play sound ${soundKey}:`, error);
    }
  }

  /**
   * Arrêter un son
   */
  stop(soundKey: string): void {
    const audio = this.audioCache.get(soundKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Arrêter tous les sons
   */
  stopAll(): void {
    this.audioCache.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Activer/désactiver le son
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Sons spécifiques pour événements chauffeur
   */
  sounds = {
    newRide: () => this.play('new_ride', 1.0, true), // Loop jusqu'à acceptation
    stopNewRide: () => this.stop('new_ride'),
    rideAccepted: () => this.play('ride_accepted', 0.8),
    navigationTurn: () => this.play('navigation_turn', 0.6),
    arrival: () => this.play('arrival', 0.8),
    completed: () => this.play('completed', 0.9)
  };
}

// Export singleton
export const audioService = new AudioService();

// Précharger au démarrage
if (typeof window !== 'undefined') {
  audioService.preloadSounds();
}
