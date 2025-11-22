import { useCallback, useRef, useEffect } from 'react';
import { NOTIFICATION_CONFIG } from '@/config/notificationConfig';

interface NotificationSoundOptions {
  enabled?: boolean;
  volume?: number; // 0 to 1
}

// Mapping des types de notifications vers les fichiers audio
const SOUND_FILES = {
  transport: '/sounds/transport/driverAssigned.mp3',
  delivery: '/sounds/delivery/deliveryPicked.mp3',
  marketplace: '/sounds/marketplace/newOrder.mp3',
  lottery: '/sounds/general/success.mp3',
  wallet: '/sounds/general/paymentReceived.mp3',
  chat: '/sounds/chat/message.mp3',
  system: '/sounds/general/general.mp3',
  default: '/sounds/general/general.mp3'
} as const;

// Fallback: sons synthétiques avec Web Audio API
const SYNTHETIC_SOUNDS = {
  transport: { frequency: 800, duration: 200, waveType: 'sine' as OscillatorType },
  delivery: { frequency: 600, duration: 150, waveType: 'triangle' as OscillatorType },
  marketplace: { frequency: 1000, duration: 180, waveType: 'sine' as OscillatorType },
  lottery: { frequency: 1200, duration: 300, waveType: 'square' as OscillatorType },
  wallet: { frequency: 900, duration: 250, waveType: 'sine' as OscillatorType },
  chat: { frequency: 700, duration: 100, waveType: 'sine' as OscillatorType },
  system: { frequency: 500, duration: 150, waveType: 'sine' as OscillatorType },
  default: { frequency: 440, duration: 200, waveType: 'sine' as OscillatorType }
};

export const useNotificationSound = (options: NotificationSoundOptions = {}) => {
  const { enabled = true, volume = 0.7 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    // Initialiser l'AudioContext pour les sons synthétiques
    if (!audioContextRef.current && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API non disponible:', error);
      }
    }

    return () => {
      // Nettoyer les audio éléments en cache
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
    };
  }, []);

  const playSyntheticSound = useCallback((type: keyof typeof SYNTHETIC_SOUNDS) => {
    if (!audioContextRef.current) return;

    const config = SYNTHETIC_SOUNDS[type] || SYNTHETIC_SOUNDS.default;
    const ctx = audioContextRef.current;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.waveType;
      oscillator.frequency.value = config.frequency;

      gainNode.gain.value = volume * 0.3; // Réduire le volume des sons synthétiques

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;
      oscillator.start(now);
      oscillator.stop(now + config.duration / 1000);

      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration / 1000);
    } catch (error) {
      console.warn('Erreur lors de la lecture du son synthétique:', error);
    }
  }, [volume]);

  const playSound = useCallback(async (type: keyof typeof SOUND_FILES | string) => {
    if (!enabled) return;

    const soundKey = (type in SOUND_FILES ? type : 'default') as keyof typeof SOUND_FILES;
    const soundPath = SOUND_FILES[soundKey];

    // Essayer de jouer le fichier audio
    try {
      let audio = audioCache.current.get(soundPath);

      if (!audio) {
        audio = new Audio(soundPath);
        audio.volume = volume;
        audioCache.current.set(soundPath, audio);
      }

      // Reset si déjà en cours de lecture
      if (!audio.paused) {
        audio.currentTime = 0;
      }

      await audio.play();
    } catch (error) {
      console.warn(`Fichier audio ${soundPath} non disponible, utilisation du son synthétique`, error);
      
      // Fallback vers son synthétique
      playSyntheticSound(soundKey as keyof typeof SYNTHETIC_SOUNDS);
    }
  }, [enabled, volume, playSyntheticSound]);

  const playNotificationSound = useCallback((eventKey: string) => {
    const soundType = NOTIFICATION_CONFIG.SOUND_MAPPING[eventKey as keyof typeof NOTIFICATION_CONFIG.SOUND_MAPPING] || 'default';
    
    // Mapper les noms de sons vers les types
    const typeMapping: Record<string, keyof typeof SOUND_FILES> = {
      'driverAssigned': 'transport',
      'driverArrived': 'transport',
      'rideStarted': 'transport',
      'orderConfirmed': 'marketplace',
      'deliveryPicked': 'delivery',
      'deliveryCompleted': 'delivery',
      'newOrder': 'marketplace',
      'paymentReceived': 'wallet',
      'message': 'chat',
      'general': 'system',
      'success': 'system',
      'error': 'system',
      'warning': 'system',
      'urgentAlert': 'system'
    };

    const mappedType = typeMapping[soundType] || 'system';
    playSound(mappedType);
  }, [playSound]);

  return {
    playSound,
    playNotificationSound,
    playSyntheticSound
  };
};
