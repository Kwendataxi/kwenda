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
  private volume: number = 0.9; // 90% volume par défaut

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
    return stored ? parseFloat(stored) : 0.9; // 90% par défaut
  }

  async playNotificationSound(type: keyof NotificationSounds = 'general') {
    console.log(`🔊 [NotifSound] Tentative lecture: ${type}`);
    
    // Charger préférences
    this.soundEnabled = this.getSoundEnabled();
    this.volume = this.getVolume();

    if (!this.soundEnabled) {
      console.log('🔇 [NotifSound] Sons désactivés');
      return;
    }

    try {
      const soundUrl = this.sounds[type];
      console.log(`📁 [NotifSound] Chargement: ${soundUrl}`);
      
      const audioBuffer = await this.loadSound(soundUrl);
      
      if (audioBuffer) {
        console.log(`✅ [NotifSound] Lecture OK: ${type}`);
        await this.playBuffer(audioBuffer);
      } else {
        console.warn(`⚠️ [NotifSound] Fallback beep pour: ${type}`);
        this.playFallbackSound(type);
      }
      
      // 📳 VIBRATION couplée sur mobile
      this.triggerVibration(type);
    } catch (error) {
      console.error(`❌ [NotifSound] Erreur: ${type}`, error);
      this.playFallbackSound(type);
      this.triggerVibration(type);
    }
  }

  private playFallbackSound(type: keyof NotificationSounds = 'general') {
    // Create distinctive beep sounds by category
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Fréquences distinctives par catégorie
    const frequencies: Record<keyof NotificationSounds, number> = {
      // Marketplace - aigus (effet "ka-ching")
      newOrder: 1000,
      orderConfirmed: 900,
      paymentReceived: 1100,
      productApproved: 950,
      productRejected: 400,
      productFlagged: 700,
      lowStockAlert: 650,
      reviewReceived: 850,
      
      // Transport - médiums
      driverAssigned: 700,
      driverArrived: 650,
      rideStarted: 750,
      
      // Livraison - rythmés
      deliveryPicked: 800,
      deliveryCompleted: 850,
      
      // Admin - alertes
      urgentAlert: 1200,
      error: 400,
      warning: 600,
      success: 900,
      
      // Chat
      message: 800,
      
      // Défaut
      general: 800,
      info: 750
    };
    
    oscillator.frequency.value = frequencies[type] || 800;
    oscillator.type = type.includes('urgent') || type === 'error' ? 'sawtooth' : 
                      type.includes('payment') || type.includes('order') ? 'triangle' : 'sine';
    
    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  private triggerVibration(type: keyof NotificationSounds) {
    if (!('vibrate' in navigator)) return;

    // Patterns de vibration distinctifs par catégorie
    const vibrationPatterns: Record<string, number | number[]> = {
      // Marketplace - doubles vibrations
      newOrder: [100, 50, 100],
      orderConfirmed: [100, 50, 100],
      paymentReceived: [50, 30, 50, 30, 50], // Triple beep
      
      // Transport - vibrations moyennes
      driverAssigned: [100, 50, 100],
      driverArrived: [200],
      rideStarted: [100],
      
      // Livraison - courtes et rythmées
      deliveryPicked: [50, 30, 50],
      deliveryCompleted: [100, 50, 100, 50, 200],
      
      // Admin - urgentes et longues
      urgentAlert: [200, 100, 200, 100, 200],
      error: [200, 100, 200],
      warning: [150],
      success: [50, 30, 50],
      
      // Chat - légère
      message: [50],
      
      // Défaut
      general: [100],
      info: [50]
    };

    const pattern = vibrationPatterns[type] || 100;
    navigator.vibrate(pattern);
  }

  // Preload sounds for better performance
  async preloadSounds() {
    const soundUrls = Object.values(this.sounds);
    await Promise.all(soundUrls.map(url => this.loadSound(url)));
  }
}

export const notificationSoundService = new NotificationSoundService();