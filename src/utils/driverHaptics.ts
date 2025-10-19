/**
 * 📳 PHASE 6: Retours haptiques pour actions chauffeur
 */

export const driverHaptics = {
  // Course acceptée - Vibration de succès
  onRideAccepted: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10, 50, 30]);
    }
  },

  // Course refusée - Vibration légère
  onRideRejected: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  // Course terminée - Vibration de réussite
  onRideCompleted: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 100]);
    }
  },

  // Nouvelle notification - Vibration forte
  onNewNotification: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  // Clic bouton GPS - Feedback tactile
  onGPSStart: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  // Mise en ligne - Feedback de confirmation
  onGoOnline: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }
  },

  // Mise hors ligne - Feedback simple
  onGoOffline: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }
};
