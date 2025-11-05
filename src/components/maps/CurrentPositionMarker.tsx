import { useEffect, useRef } from 'react';

interface CurrentPositionMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number } | null;
}

export default function CurrentPositionMarker({ map, position }: CurrentPositionMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  const getCurrentPositionSVG = (): string => {
    return `
      <svg width="68" height="68" viewBox="0 0 68 68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-position">
            <feDropShadow dx="0" dy="2" stdDeviation="5" flood-opacity="0.35"/>
          </filter>
        </defs>
        
        <!-- Pulse externe ultra-visible -->
        <circle cx="34" cy="34" r="30" fill="#4285F4" opacity="0.2">
          <animate attributeName="r" from="30" to="34" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Cercle principal bleu -->
        <circle cx="34" cy="34" r="26" fill="#4285F4" opacity="0.35"/>
        
        <!-- Cercle interne -->
        <circle cx="34" cy="34" r="18" fill="#4285F4" filter="url(#shadow-position)"/>
        
        <!-- Bordure blanche -->
        <circle cx="34" cy="34" r="18" fill="none" stroke="white" stroke-width="3"/>
        
        <!-- Point central blanc -->
        <circle cx="34" cy="34" r="7" fill="white"/>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || !position || !window.google) return;

    const svgContent = getCurrentPositionSVG();
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

    if (!markerRef.current) {
      const marker = new google.maps.Marker({
        position,
        map,
        title: 'Votre position',
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(68, 68),
          anchor: new google.maps.Point(34, 34)
        },
        zIndex: 2000,
        optimized: false
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setPosition(position);
    }
  }, [map, position]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}
