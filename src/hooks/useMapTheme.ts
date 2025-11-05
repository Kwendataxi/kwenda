import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// Styles Yango ultra-soft et épurés pour mode clair
const lightMapStyles: google.maps.MapTypeStyle[] = [
  // Masquer TOUS les POI/transit pour clarté maximale
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  
  // Background ultra-clair (blanc cassé)
  { 
    elementType: 'geometry', 
    stylers: [{ color: '#fafafa' }] 
  },
  
  // Routes blanches épurées
  { 
    featureType: 'road', 
    elementType: 'geometry', 
    stylers: [{ color: '#ffffff' }] 
  },
  { 
    featureType: 'road', 
    elementType: 'labels', 
    stylers: [{ visibility: 'simplified' }] 
  },
  { 
    featureType: 'road.highway', 
    elementType: 'geometry', 
    stylers: [{ color: '#ffffff' }, { lightness: 10 }] 
  },
  
  // Eau bleu très soft
  { 
    featureType: 'water', 
    elementType: 'geometry',
    stylers: [{ color: '#e0f2fe' }] 
  },
  
  // Labels minimalistes gris clair
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'off' }]
  }
];

// Styles de carte Yango-like épurés pour mode sombre
const darkMapStyles: google.maps.MapTypeStyle[] = [
  // Masquer TOUS les POI
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  
  // Background gris anthracite soft (pas trop noir)
  { 
    elementType: 'geometry', 
    stylers: [{ color: '#1e293b' }] 
  },
  
  // Routes gris clair pour contraste
  { 
    featureType: 'road', 
    elementType: 'geometry', 
    stylers: [{ color: '#334155' }] 
  },
  { 
    featureType: 'road', 
    elementType: 'labels', 
    stylers: [{ visibility: 'simplified' }] 
  },
  { 
    featureType: 'road.highway', 
    elementType: 'geometry', 
    stylers: [{ color: '#475569' }] 
  },
  
  // Eau bleu nuit
  { 
    featureType: 'water', 
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }] 
  },
  
  // Labels soft
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'off' }]
  }
];

export function useMapTheme() {
  const { theme, resolvedTheme } = useTheme();
  const [mapStyles, setMapStyles] = useState<google.maps.MapTypeStyle[]>(lightMapStyles);

  useEffect(() => {
    const currentTheme = theme === 'system' ? resolvedTheme : theme;
    setMapStyles(currentTheme === 'dark' ? darkMapStyles : lightMapStyles);
  }, [theme, resolvedTheme]);

  return {
    mapStyles,
    isDark: (theme === 'system' ? resolvedTheme : theme) === 'dark'
  };
}
