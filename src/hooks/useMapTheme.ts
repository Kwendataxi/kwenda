import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// Styles de carte modernes pour mode clair
const lightMapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ saturation: 10 }, { lightness: 5 }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ lightness: 15 }]
  }
];

// Styles de carte modernes pour mode sombre
const darkMapStyles: google.maps.MapTypeStyle[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
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
