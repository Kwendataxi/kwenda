export const SUPPORTED_CITIES = [
  { value: 'Kinshasa', label: '🇨🇩 Kinshasa', emoji: '🇨🇩' },
  { value: 'Lubumbashi', label: '🇨🇩 Lubumbashi', emoji: '🇨🇩' },
  { value: 'Kolwezi', label: '🇨🇩 Kolwezi', emoji: '🇨🇩' },
] as const;

export type CityValue = typeof SUPPORTED_CITIES[number]['value'];
