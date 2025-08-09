// Configuration centralisée pour toutes les notifications
// Durée maximale standardisée à 2 secondes (2000ms)

export const NOTIFICATION_CONFIG = {
  // Durées principales (en millisecondes)
  DEFAULT_DURATION: 2000,
  CRITICAL_DURATION: 1500, // Pour notifications critiques
  INFO_DURATION: 2000,     // Pour notifications informatives
  
  // Durées spécifiques par type
  TOAST_REMOVE_DELAY: 2000,               // Shadcn Toast
  LOTTERY_NOTIFICATION_DURATION: 2000,    // Notifications loterie
  LOTTERY_ANIMATION_DURATION: 2000,       // Animations tickets
  ADMIN_NOTIFICATION_DURATION: 2000,      // Notifications admin
  RIDE_REQUEST_TIMEOUT: 60000,            // Timeout demandes course (60s)
  
  // Durées des animations (en millisecondes)
  ANIMATION: {
    ENTRANCE_DURATION: 300,  // Animation d'entrée
    EXIT_DURATION: 300,      // Animation de sortie
    FADE_DURATION: 200,      // Fondu
  },
  
  // Configuration Sonner
  SONNER: {
    DEFAULT_DURATION: 2000,
    SUCCESS_DURATION: 2000,
    ERROR_DURATION: 2000,
    INFO_DURATION: 2000,
    WARNING_DURATION: 2000,
  },
  
  // Délais pour retry et autres opérations
  RETRY_INTERVALS: [1000, 3000, 5000, 10000, 20000], // Escalade progressive
  MAX_RETRIES: 5,
  
  // Types de priorité et leurs durées
  PRIORITY_DURATIONS: {
    low: 2000,
    normal: 2000,
    high: 1500,  // Un peu plus court pour attirer l'attention
    urgent: 1500
  }
} as const;

// Types dérivés pour TypeScript
export type NotificationDuration = typeof NOTIFICATION_CONFIG.DEFAULT_DURATION;
export type AnimationDuration = typeof NOTIFICATION_CONFIG.ANIMATION.EXIT_DURATION;
export type PriorityLevel = keyof typeof NOTIFICATION_CONFIG.PRIORITY_DURATIONS;

// Fonction utilitaire pour obtenir la durée selon la priorité
export const getDurationByPriority = (priority: PriorityLevel = 'normal'): number => {
  return NOTIFICATION_CONFIG.PRIORITY_DURATIONS[priority];
};

// Validation des durées (ne doit pas dépasser 2 secondes)
export const validateNotificationDuration = (duration: number): number => {
  const MAX_ALLOWED_DURATION = 2000;
  return Math.min(duration, MAX_ALLOWED_DURATION);
};