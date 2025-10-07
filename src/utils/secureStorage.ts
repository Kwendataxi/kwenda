/**
 * 🔐 STOCKAGE SÉCURISÉ CHIFFRÉ
 * 
 * Utilitaire de chiffrement pour localStorage afin de protéger
 * les données sensibles contre l'accès non autorisé
 * 
 * @security Utilise AES-256 pour le chiffrement
 */

import CryptoJS from 'crypto-js';

// Clé de chiffrement - En production, devrait être générée dynamiquement
const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || 'kwenda-secure-2025-prod';

/**
 * Interface de stockage sécurisé compatible localStorage
 */
export const secureStorage = {
  /**
   * Stocke une valeur chiffrée dans localStorage
   * @param key - Clé de stockage
   * @param value - Valeur à stocker (sera sérialisée en JSON puis chiffrée)
   */
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(serialized, ENCRYPTION_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('❌ Erreur de chiffrement:', error);
      // Fallback: stockage non chiffré en cas d'erreur critique
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  /**
   * Récupère et déchiffre une valeur depuis localStorage
   * @param key - Clé de stockage
   * @returns Valeur déchiffrée ou null si inexistante/invalide
   */
  getItem(key: string): any | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      // Tenter le déchiffrement
      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        // Données potentiellement corrompues ou clé incorrecte
        console.warn('⚠️ Impossible de déchiffrer les données pour:', key);
        return null;
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('❌ Erreur de déchiffrement:', error);
      // Tentative de lecture directe (compatibilité avec ancien stockage non chiffré)
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  },

  /**
   * Supprime une clé du localStorage
   * @param key - Clé à supprimer
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Vide tout le localStorage sécurisé
   */
  clear(): void {
    localStorage.clear();
  },

  /**
   * Vérifie si une clé existe
   * @param key - Clé à vérifier
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Migration des données non chiffrées vers stockage sécurisé
 * @param key - Clé à migrer
 */
export const migrateToSecureStorage = (key: string): void => {
  try {
    const existing = localStorage.getItem(key);
    if (!existing) return;

    // Tenter de parser directement (données non chiffrées)
    try {
      const parsed = JSON.parse(existing);
      // Si parsing réussit, c'est du non-chiffré → rechiffrer
      secureStorage.setItem(key, parsed);
      console.log(`✅ Migré vers stockage sécurisé: ${key}`);
    } catch {
      // Déjà chiffré ou invalide, ne rien faire
    }
  } catch (error) {
    console.error('❌ Erreur de migration:', error);
  }
};
