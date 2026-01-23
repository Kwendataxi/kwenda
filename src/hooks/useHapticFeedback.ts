import { useCallback } from 'react';

type HapticIntensity = 'light' | 'medium' | 'heavy';

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((intensity: HapticIntensity = 'medium') => {
    // Check if the Vibration API is supported
    if (!('vibrate' in navigator)) {
      return;
    }

    let pattern: number | number[] = 0;

    switch (intensity) {
      case 'light':
        pattern = 10;
        break;
      case 'medium':
        pattern = 20;
        break;
      case 'heavy':
        pattern = [30, 10, 30];
        break;
      default:
        pattern = 20;
    }

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, []);

  const triggerSuccess = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10, 50, 30]);
    }
  }, []);

  const triggerError = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  }, []);

  return {
    triggerHaptic,
    triggerSuccess,
    triggerError
  };
};
