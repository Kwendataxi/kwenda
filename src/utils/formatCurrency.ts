/**
 * Utilitaires de formatage des devises pour l'application Kwenda
 * RDC uniquement - CDF (Franc Congolais)
 */

export type Currency = 'CDF';

export const formatCurrency = (amount: number, currency: Currency = 'CDF'): string => {
  return `${amount.toLocaleString()} ${currency}`;
};

export const formatCurrencyCompact = (amount: number, currency: Currency = 'CDF'): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${currency}`;
  }
  return `${amount} ${currency}`;
};

export const getCurrencyByCity = (city: string): Currency => {
  return 'CDF'; // Toutes les villes sont en RDC
};

/**
 * Fonction raccourcie pour formater en CDF (défaut RDC)
 */
export const formatCDF = (amount: number): string => {
  return formatCurrency(amount, 'CDF');
};

/**
 * Fonction qui détecte automatiquement la devise selon la ville
 */
export const formatPrice = (amount: number, city?: string): string => {
  return formatCurrency(amount, 'CDF');
};
