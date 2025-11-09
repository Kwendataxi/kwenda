export const SUPPORTED_CITIES = [
  { value: 'Kinshasa', label: '🏙️ Kinshasa', emoji: '🏙️' },
  { value: 'Lubumbashi', label: '⚙️ Lubumbashi', emoji: '⚙️' },
  { value: 'Kolwezi', label: '💎 Kolwezi', emoji: '💎' },
  // ⚠️ ABIDJAN: Test uniquement - Projet exclusif RDC en production
  { value: 'Abidjan', label: '🌴 Abidjan (Test)', emoji: '🌴' },
] as const;

export type CityValue = typeof SUPPORTED_CITIES[number]['value'];
