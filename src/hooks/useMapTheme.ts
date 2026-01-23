import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// Styles Yango ultra-soft et épurés pour mode clair - ROBUSTES
const lightMapStyles: google.maps.MapTypeStyle[] = [
  // Masquer POI/transit pour clarté maximale
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  
  // Background ultra-clair (blanc cassé) - jamais noir
  { 
    elementType: 'geometry', 
    stylers: [{ color: '#f8fafc' }] 
  },
  
  // Landscape explicitement défini
  { 
    featureType: 'landscape', 
    elementType: 'geometry', 
    stylers: [{ color: '#f1f5f9' }] 
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
    stylers: [{ color: '#e2e8f0' }] 
  },
  
  // Eau bleu très soft
  { 
    featureType: 'water', 
    elementType: 'geometry',
    stylers: [{ color: '#dbeafe' }] 
  },
  
  // Labels minimalistes gris clair
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 2 }]
  }
];

// Styles de carte pour mode sombre - PLUS CLAIR pour visibilité
const darkMapStyles: google.maps.MapTypeStyle[] = [
  // Masquer TOUS les POI
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  
  // Background gris-bleu plus clair (pas trop sombre)
  { 
    elementType: 'geometry', 
    stylers: [{ color: '#334155' }] 
  },
  
  // Landscape plus clair
  { 
    featureType: 'landscape', 
    elementType: 'geometry', 
    stylers: [{ color: '#1e293b' }] 
  },
  
  // Routes plus visibles
  { 
    featureType: 'road', 
    elementType: 'geometry', 
    stylers: [{ color: '#475569' }] 
  },
  { 
    featureType: 'road', 
    elementType: 'labels', 
    stylers: [{ visibility: 'simplified' }] 
  },
  { 
    featureType: 'road.highway', 
    elementType: 'geometry', 
    stylers: [{ color: '#64748b' }] 
  },
  
  // Eau bleu nuit mais visible
  { 
    featureType: 'water', 
    elementType: 'geometry',
    stylers: [{ color: '#1e40af' }] 
  },
  
  // Labels clairement visibles
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1e293b' }, { weight: 2 }]
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
