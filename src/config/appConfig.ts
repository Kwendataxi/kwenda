export type AppType = 'client' | 'driver' | 'partner';

export const APP_CONFIG = {
  type: (import.meta.env.VITE_APP_TYPE || 'client') as AppType,
  name: import.meta.env.VITE_APP_NAME || 'Kwenda Taxi',
  appId: import.meta.env.VITE_APP_ID || 'cd.kwenda.taxi',
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#DC2626',
  defaultRoute: import.meta.env.VITE_DEFAULT_ROUTE || '/client',
  authRoute: import.meta.env.VITE_AUTH_ROUTE || '/auth',
};

// Helper pour savoir quelle app est lancée
export const isClientApp = () => APP_CONFIG.type === 'client';
export const isDriverApp = () => APP_CONFIG.type === 'driver';
export const isPartnerApp = () => APP_CONFIG.type === 'partner';

// Helper pour vérifier si on est en mode build spécifique
export const isSpecificBuild = () => import.meta.env.VITE_APP_TYPE !== undefined;
