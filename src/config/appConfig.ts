/**
 * 📱 KWENDA SUPER APP CONFIGURATION
 * 
 * Configuration unique pour l'application multi-rôles
 * L'utilisateur bascule entre les espaces (Client/Chauffeur/Partenaire) depuis l'app
 */

export type UserRole = 'client' | 'driver' | 'partner' | 'admin' | 'restaurant';

export const APP_CONFIG = {
  name: 'Kwenda',
  appId: 'cd.kwenda.app',
  primaryColor: '#DC2626',
  defaultRoute: '/app',
  authRoute: '/auth',
  version: '1.0.0',
};

// Couleurs par rôle pour le thème dynamique
export const ROLE_COLORS: Record<UserRole, string> = {
  client: '#DC2626',    // Rouge
  driver: '#F59E0B',    // Orange
  partner: '#10B981',   // Vert
  admin: '#6366F1',     // Indigo
  restaurant: '#EC4899', // Rose
};

// Routes par défaut selon le rôle
export const ROLE_ROUTES: Record<UserRole, string> = {
  client: '/client',
  driver: '/chauffeur',
  partner: '/partenaire',
  admin: '/operatorx/admin',
  restaurant: '/restaurant',
};

// Helper pour obtenir la couleur d'un rôle
export const getRoleColor = (role: UserRole): string => ROLE_COLORS[role] || APP_CONFIG.primaryColor;

// Helper pour obtenir la route d'un rôle
export const getRoleRoute = (role: UserRole): string => ROLE_ROUTES[role] || '/client';
