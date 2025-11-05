import { useEffect, useRef } from 'react';

interface CurrentPositionMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number } | null;
  onClickPosition?: () => void;
}

export default function CurrentPositionMarker({ map, position, onClickPosition }: CurrentPositionMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  const getCurrentPositionSVG = (): string => {
    return `
      <svg width="68" height="90" viewBox="0 0 68 90" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-position">
            <feDropShadow dx="0" dy="2" stdDeviation="5" flood-opacity="0.35"/>
          </filter>
        </defs>
        
        <!-- Pulse externe ultra-visible -->
        <circle cx="34" cy="45" r="30" fill="#4285F4" opacity="0.2">
          <animate attributeName="r" from="30" to="34" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Cercle principal bleu -->
        <circle cx="34" cy="45" r="26" fill="#4285F4" opacity="0.35"/>
        
        <!-- Cercle interne -->
        <circle cx="34" cy="45" r="18" fill="#4285F4" filter="url(#shadow-position)"/>
        
        <!-- Bordure blanche -->
        <circle cx="34" cy="45" r="18" fill="none" stroke="white" stroke-width="3"/>
        
        <!-- Point central blanc -->
        <circle cx="34" cy="45" r="7" fill="white"/>
        
        <!-- Indicateur de clic -->
        <text x="34" y="80" font-size="9" fill="#4285F4" text-anchor="middle" font-weight="600" opacity="0.8">
          Cliquez-moi
        </text>
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
        title: 'Cliquez pour pointer votre position exacte',
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(68, 90),
          anchor: new google.maps.Point(34, 60)
        },
        zIndex: 2000,
        optimized: false,
        clickable: true,
        cursor: 'pointer'
      });

      // Ajouter listener de clic
      marker.addListener('click', () => {
        console.log('📍 Position marker clicked:', position);
        onClickPosition?.();
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setPosition(position);
    }
  }, [map, position, onClickPosition]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}
