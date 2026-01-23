/**
 * ⭐ Hook système de notation app intelligent
 * - In-App Review pour iOS/Android
 * - Déclenchement intelligent basé sur l'usage
 * - Persistance des préférences utilisateur
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// On importe dynamiquement pour éviter les erreurs sur web
let AppReview: any = null;

const loadAppReview = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capawesome/capacitor-app-review');
      AppReview = module.AppReview;
    } catch (e) {
      logger.warn('AppReview plugin not available');
    }
  }
};

// Initialiser le chargement
loadAppReview();

interface RatingPreferences {
  lastPromptDate: string | null;
  hasRated: boolean;
  dismissedCount: number;
  neverAskAgain: boolean;
  successfulTripsCount: number;
}

const STORAGE_KEY = 'kwenda_rating_preferences';
const MIN_TRIPS_BEFORE_PROMPT = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 30;
const MAX_DISMISS_COUNT = 3;

export const useAppRating = () => {
  const [preferences, setPreferences] = useState<RatingPreferences>({
    lastPromptDate: null,
    hasRated: false,
    dismissedCount: 0,
    neverAskAgain: false,
    successfulTripsCount: 0
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  // Charger les préférences au montage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        logger.error('Failed to parse rating preferences', e);
      }
    }

    // Détecter la plateforme
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    setPlatform(
      Capacitor.getPlatform() === 'ios' ? 'ios' :
      Capacitor.getPlatform() === 'android' ? 'android' : 'web'
    );
  }, []);

  // Sauvegarder les préférences
  const savePreferences = useCallback((newPrefs: RatingPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
  }, []);

  // Vérifier si on peut afficher le prompt
  const canShowPrompt = useCallback((): boolean => {
    if (preferences.hasRated) return false;
    if (preferences.neverAskAgain) return false;
    if (preferences.dismissedCount >= MAX_DISMISS_COUNT) return false;
    if (preferences.successfulTripsCount < MIN_TRIPS_BEFORE_PROMPT) return false;

    if (preferences.lastPromptDate) {
      const lastDate = new Date(preferences.lastPromptDate);
      const daysSinceLastPrompt = Math.floor(
        (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) return false;
    }

    return true;
  }, [preferences]);

  // Incrémenter le compteur de courses réussies
  const recordSuccessfulTrip = useCallback(() => {
    const newPrefs = {
      ...preferences,
      successfulTripsCount: preferences.successfulTripsCount + 1
    };
    savePreferences(newPrefs);

    // Vérifier si on doit afficher le prompt
    if (canShowPrompt()) {
      setTimeout(() => setShowPrompt(true), 2000); // Délai pour UX
    }
  }, [preferences, savePreferences, canShowPrompt]);

  // Demander la notation In-App
  const requestInAppReview = useCallback(async () => {
    if (!isNative) {
      // Sur web, ouvrir le store approprié
      openAppStore();
      return;
    }

    try {
      if (AppReview) {
        await AppReview.requestReview();
        logger.info('In-app review requested successfully');
        
        savePreferences({
          ...preferences,
          hasRated: true,
          lastPromptDate: new Date().toISOString()
        });
        
        setShowPrompt(false);
        toast.success('Merci pour votre évaluation ! 🌟');
      }
    } catch (error) {
      logger.error('In-app review failed', error);
      // Fallback: ouvrir le store
      openAppStore();
    }
  }, [isNative, preferences, savePreferences]);

  // Ouvrir le store approprié
  const openAppStore = useCallback(() => {
    const iosUrl = 'https://apps.apple.com/cd/app/kwenda-client/id6738154982';
    const androidUrl = 'https://play.google.com/store/apps/details?id=cd.kwenda.client';

    let url = androidUrl; // Default
    
    if (platform === 'ios') {
      url = iosUrl;
    } else if (platform === 'android') {
      // Essayer d'abord market://
      try {
        window.open(`market://details?id=cd.kwenda.client`, '_system');
        return;
      } catch {
        url = androidUrl;
      }
    }

    window.open(url, '_blank');
    
    savePreferences({
      ...preferences,
      hasRated: true,
      lastPromptDate: new Date().toISOString()
    });
    
    setShowPrompt(false);
  }, [platform, preferences, savePreferences]);

  // Différer la demande
  const deferRating = useCallback(() => {
    savePreferences({
      ...preferences,
      dismissedCount: preferences.dismissedCount + 1,
      lastPromptDate: new Date().toISOString()
    });
    setShowPrompt(false);
    toast.info('Nous vous le demanderons plus tard');
  }, [preferences, savePreferences]);

  // Ne plus demander
  const neverAskAgain = useCallback(() => {
    savePreferences({
      ...preferences,
      neverAskAgain: true
    });
    setShowPrompt(false);
  }, [preferences, savePreferences]);

  // Forcer l'affichage du prompt (pour les settings)
  const triggerPrompt = useCallback(() => {
    if (!preferences.hasRated) {
      setShowPrompt(true);
    } else {
      openAppStore();
    }
  }, [preferences.hasRated, openAppStore]);

  return {
    showPrompt,
    setShowPrompt,
    isNative,
    platform,
    preferences,
    canShowPrompt: canShowPrompt(),
    recordSuccessfulTrip,
    requestInAppReview,
    openAppStore,
    deferRating,
    neverAskAgain,
    triggerPrompt
  };
};
