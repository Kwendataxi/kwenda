import { useEffect, useRef } from 'react';

interface CurrentPositionMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number } | null;
}

export default function CurrentPositionMarker({ map, position }: CurrentPositionMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  const getCurrentPositionSVG = (): string => {
    return `
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <!-- Pulse externe -->
        <circle cx="32" cy="32" r="28" fill="#4285F4" opacity="0.15">
          <animate attributeName="r" from="28" to="32" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.15" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Cercle principal bleu -->
        <circle cx="32" cy="32" r="24" fill="#4285F4" opacity="0.3"/>
        
        <!-- Cercle interne -->
        <circle cx="32" cy="32" r="16" fill="#4285F4"/>
        
        <!-- Point central blanc -->
        <circle cx="32" cy="32" r="6" fill="white"/>
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
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(64, 64),
          anchor: new google.maps.Point(32, 32)
        },
        zIndex: 1002,
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
