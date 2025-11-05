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
      <svg width="80" height="95" viewBox="0 0 80 95" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-pin">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.4"/>
          </filter>
        </defs>
        
        <!-- Pulse d'arrière-plan rouge -->
        <circle cx="40" cy="40" r="35" fill="#EF4444" opacity="0.15">
          <animate attributeName="r" from="30" to="40" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.3" to="0" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Ombre du pin -->
        <ellipse cx="40" cy="88" rx="18" ry="4" fill="#000000" opacity="0.2"/>
        
        <!-- Corps du pin (forme de goutte inversée) -->
        <path d="M40 20 C50 20, 58 28, 58 40 C58 52, 40 70, 40 70 C40 70, 22 52, 22 40 C22 28, 30 20, 40 20 Z" 
              fill="#EF4444" 
              filter="url(#shadow-pin)"/>
        
        <!-- Cercle intérieur blanc -->
        <circle cx="40" cy="40" r="8" fill="white"/>
        
        <!-- Point central rouge -->
        <circle cx="40" cy="40" r="4" fill="#DC2626"/>
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
          scaledSize: new google.maps.Size(80, 95),
          anchor: new google.maps.Point(40, 70)
        },
        zIndex: 3000,
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
