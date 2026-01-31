/**
 * 🗺️ Utilitaires de padding dynamique pour Google Maps
 * Calcule des marges intelligentes selon le contexte UI
 */

export interface MapPaddingConfig {
  bottomSheetHeight?: number;
  topHeaderHeight?: number;
  screenHeight?: number;
  hasDriverInfo?: boolean;
  isMobile?: boolean;
  isFullscreen?: boolean;
}

export interface MapPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Configuration par défaut basée sur les designs Kwenda
const DEFAULT_PADDING = {
  MOBILE_BOTTOM_SHEET_SMALL: 300,
  MOBILE_BOTTOM_SHEET_LARGE: 420,
  DESKTOP_PANEL: 350,
  HEADER_HEIGHT: 80,
  DRIVER_INFO_HEIGHT: 100,
  SIDE_MARGIN: 60,
  SIDE_MARGIN_MOBILE: 40,
  MIN_TOP: 80,
  EXTRA_BOTTOM_MARGIN: 30,
};

/**
 * Calcule le padding dynamique pour fitBounds
 * Garantit que tous les éléments de la carte sont visibles
 */
export function calculateDynamicPadding(config: MapPaddingConfig = {}): MapPadding {
  const {
    bottomSheetHeight = DEFAULT_PADDING.MOBILE_BOTTOM_SHEET_SMALL,
    topHeaderHeight = DEFAULT_PADDING.HEADER_HEIGHT,
    screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800,
    hasDriverInfo = false,
    isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : true,
    isFullscreen = false,
  } = config;

  // Mode plein écran: padding uniforme minimal
  if (isFullscreen) {
    return {
      top: 120,
      right: 80,
      bottom: 120,
      left: 80,
    };
  }

  // Calcul du padding bottom basé sur la hauteur du bottom sheet
  const bottomPadding = bottomSheetHeight + DEFAULT_PADDING.EXTRA_BOTTOM_MARGIN;
  
  // Padding top: header + marge de sécurité
  const topPadding = Math.max(
    topHeaderHeight + 20,
    DEFAULT_PADDING.MIN_TOP
  );

  // Padding latéral adapté au device
  const sidePadding = isMobile 
    ? DEFAULT_PADDING.SIDE_MARGIN_MOBILE 
    : DEFAULT_PADDING.SIDE_MARGIN;

  // Ajouter de l'espace si info chauffeur visible
  const extraBottom = hasDriverInfo ? DEFAULT_PADDING.DRIVER_INFO_HEIGHT : 0;

  return {
    top: topPadding,
    right: sidePadding,
    bottom: bottomPadding + extraBottom,
    left: sidePadding,
  };
}

/**
 * Padding prédéfinis pour des contextes courants
 */
export const PRESET_PADDINGS = {
  // Taxi: bottom sheet avec prix
  taxi_booking: (): MapPadding => calculateDynamicPadding({
    bottomSheetHeight: 420,
    topHeaderHeight: 80,
    isMobile: true,
  }),

  // Tracking: info chauffeur + ETA
  tracking_with_driver: (): MapPadding => calculateDynamicPadding({
    bottomSheetHeight: 300,
    topHeaderHeight: 100,
    hasDriverInfo: true,
    isMobile: true,
  }),

  // Livraison: panel de service
  delivery_booking: (): MapPadding => calculateDynamicPadding({
    bottomSheetHeight: 380,
    topHeaderHeight: 80,
    isMobile: true,
  }),

  // Aperçu simple (preview)
  simple_preview: (): MapPadding => ({
    top: 80,
    right: 60,
    bottom: 80,
    left: 60,
  }),

  // Mode carte live (home)
  live_map_home: (): MapPadding => calculateDynamicPadding({
    bottomSheetHeight: 200,
    topHeaderHeight: 60,
    isMobile: true,
  }),

  // Desktop avec panel latéral
  desktop_with_panel: (): MapPadding => ({
    top: 100,
    right: 400, // Panel à droite
    bottom: 100,
    left: 80,
  }),
};

/**
 * Détecte si le device est mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth < 768;
}

/**
 * Obtient la hauteur du viewport
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 800;
  return window.innerHeight;
}

/**
 * Calcule un padding adaptatif basé sur le ratio d'écran
 * Plus l'écran est petit, plus le padding relatif est important
 */
export function getAdaptivePadding(
  baseBottomPadding: number,
  minPercentage: number = 30,
  maxPercentage: number = 50
): MapPadding {
  const screenHeight = getViewportHeight();
  
  // Limiter le padding bottom à un pourcentage du viewport
  const maxBottomPadding = screenHeight * (maxPercentage / 100);
  const minBottomPadding = screenHeight * (minPercentage / 100);
  
  const adaptedBottom = Math.max(
    Math.min(baseBottomPadding, maxBottomPadding),
    minBottomPadding
  );

  return calculateDynamicPadding({
    bottomSheetHeight: adaptedBottom,
    screenHeight,
    isMobile: isMobileDevice(),
  });
}
