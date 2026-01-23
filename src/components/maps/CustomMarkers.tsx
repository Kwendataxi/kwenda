/**
 * 🎯 Markers Personnalisés Professionnels (Style Yango/Uber)
 * Pickup: Cercle vert avec pulse animation
 * Destination: Pin rouge professionnel avec ancrage en bas
 */

import { useEffect, useRef } from 'react';

interface MarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  label?: string;
}

// ✅ Marker de départ - Cercle vert pulsant
export function PickupMarker({ map, position, label }: MarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  const getPickupSVG = (): string => {
    return `
      <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pickup-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.25"/>
          </filter>
        </defs>
        
        <!-- Pulse externe animé -->
        <circle cx="18" cy="18" r="14" fill="#22c55e" opacity="0.2">
          <animate attributeName="r" values="14;18;14" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.2;0;0.2" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Cercle principal vert -->
        <circle cx="18" cy="18" r="12" fill="#22c55e" filter="url(#pickup-shadow)"/>
        
        <!-- Bordure blanche -->
        <circle cx="18" cy="18" r="12" fill="none" stroke="white" stroke-width="3"/>
        
        <!-- Point central blanc -->
        <circle cx="18" cy="18" r="4" fill="white"/>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || !window.google) return;

    // Nettoyer l'ancien marker avant d'en créer un nouveau
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    const svgContent = getPickupSVG();
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

    const marker = new google.maps.Marker({
      position,
      map,
      title: label || 'Point de départ',
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(36, 36),
        anchor: new google.maps.Point(18, 18) // Centre du cercle
      },
      zIndex: 1000,
      optimized: false
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, position.lat, position.lng, label]);

  return null;
}

// ✅ Marker de destination - Pin rouge professionnel style Google Maps
export function DestinationMarker({ map, position, label }: MarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  const getDestinationPinSVG = (): string => {
    return `
      <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="dest-shadow" x="-50%" y="-30%" width="200%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.35"/>
          </filter>
          <linearGradient id="pin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ef4444"/>
            <stop offset="100%" style="stop-color:#dc2626"/>
          </linearGradient>
        </defs>
        
        <!-- Ombre au sol -->
        <ellipse cx="24" cy="54" rx="8" ry="2" fill="#000" opacity="0.2"/>
        
        <!-- Corps du pin -->
        <path d="M24 0C12 0 2 10 2 22C2 38 24 52 24 52S46 38 46 22C46 10 36 0 24 0Z" 
              fill="url(#pin-gradient)" filter="url(#dest-shadow)"/>
        
        <!-- Cercle intérieur blanc -->
        <circle cx="24" cy="20" r="10" fill="white"/>
        
        <!-- Point central rouge -->
        <circle cx="24" cy="20" r="5" fill="#ef4444"/>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || !window.google) return;

    // Nettoyer l'ancien marker avant d'en créer un nouveau
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    const svgContent = getDestinationPinSVG();
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

    const marker = new google.maps.Marker({
      position,
      map,
      title: label || 'Destination',
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(48, 56),
        anchor: new google.maps.Point(24, 56) // Ancrage en bas du pin
      },
      zIndex: 1001,
      optimized: false
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, position.lat, position.lng, label]);

  return null;
}
