interface NotificationSounds {
  // Marketplace
  newOrder: string;
  orderConfirmed: string;
  paymentReceived: string;
  productApproved: string;
  productRejected: string;
  productFlagged: string;
  lowStockAlert: string;
  reviewReceived: string;
  
  // Transport & Livraison
  driverAssigned: string;
  driverArrived: string;
  rideStarted: string;
  deliveryPicked: string;
  deliveryCompleted: string;
  
  // Admin
  urgentAlert: string;
  
  // Chat
  message: string;
  
  // Génériques
  success: string;
  error: string;
  warning: string;
  info: string;
  general: string;
}

class NotificationSoundService {
  private sounds: NotificationSounds = {
    // Marketplace
    newOrder: '/sounds/new-order.mp3',
    orderConfirmed: '/sounds/order-confirmed.mp3', 
    paymentReceived: '/sounds/payment-received.mp3',
    productApproved: '/sounds/product-approved.mp3',
    productRejected: '/sounds/product-rejected.mp3',
    productFlagged: '/sounds/product-flagged.mp3',
    lowStockAlert: '/sounds/low-stock.mp3',
    reviewReceived: '/sounds/review-received.mp3',
    
    // Transport & Livraison
    driverAssigned: '/sounds/driver-assigned.mp3',
    driverArrived: '/sounds/driver-arrived.mp3',
    rideStarted: '/sounds/ride-started.mp3',
    deliveryPicked: '/sounds/delivery-picked.mp3',
    deliveryCompleted: '/sounds/delivery-completed.mp3',
    
    // Admin
    urgentAlert: '/sounds/urgent-alert.mp3',
    
    // Chat
    message: '/sounds/message.mp3',
    
    // Génériques
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3',
    info: '/sounds/info.mp3',
    general: '/sounds/notification.mp3'
  };

  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private soundEnabled: boolean = true;
  private volume: number = 0.7;

  private async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private async loadSound(url: string): Promise<AudioBuffer | null> {
    try {
      if (this.audioBuffers.has(url)) {
        return this.audioBuffers.get(url)!;
      }

      await this.initAudioContext();
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      this.audioBuffers.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn('Failed to load notification sound:', url, error);
      return null;
    }
  }

  private async playBuffer(audioBuffer: AudioBuffer) {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = audioBuffer;
    gainNode.gain.value = this.volume; // Volume depuis préférences
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('kwenda_sounds_enabled', String(enabled));
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('kwenda_sounds_volume', String(volume));
  }

  getSoundEnabled(): boolean {
    const stored = localStorage.getItem('kwenda_sounds_enabled');
    return stored !== null ? stored === 'true' : true;
  }

  getVolume(): number {
    const stored = localStorage.getItem('kwenda_sounds_volume');
    return stored ? parseFloat(stored) : 0.7;
  }

  async playNotificationSound(type: keyof NotificationSounds = 'general') {
    // Charger préférences
    this.soundEnabled = this.getSoundEnabled();
    this.volume = this.getVolume();

    if (!this.soundEnabled) return;

    try {
      const soundUrl = this.sounds[type];
      const audioBuffer = await this.loadSound(soundUrl);
      
      if (audioBuffer) {
        await this.playBuffer(audioBuffer);
      } else {
        // Fallback to browser notification sound
        this.playFallbackSound();
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
      this.playFallbackSound();
    }
  }

  private playFallbackSound() {
    // Create a simple beep sound as fallback
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Preload sounds for better performance
  async preloadSounds() {
    const soundUrls = Object.values(this.sounds);
    await Promise.all(soundUrls.map(url => this.loadSound(url)));
  }
}

export const notificationSoundService = new NotificationSoundService();