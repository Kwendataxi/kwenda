/**
 * Utilitaires de formatage des devises pour l'application Kwenda
 * Supporte CDF (RDC) et XOF (Côte d'Ivoire)
 */

export type Currency = 'CDF' | 'XOF';

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
  const lowerCity = city.toLowerCase();
  if (lowerCity.includes('abidjan')) {
    return 'XOF';
  }
  return 'CDF'; // Default pour RDC (Kinshasa, Lubumbashi, Kolwezi)
};
