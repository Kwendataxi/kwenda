/**
 * 🎯 Markers Personnalisés Minimalistes (Style Yango)
 * Pickup: Cercle vert avec pulse
 * Destination: Cible rouge concentrique
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  type: 'pickup' | 'destination';
  label?: string;
}

export function PickupMarker({ map, position, label }: Omit<MarkerProps, 'type'>) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  const getPickupSVG = (): string => {
    return `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-pickup">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Pulse externe -->
        <circle cx="20" cy="20" r="16" fill="hsl(142 76% 36%)" opacity="0.15">
          <animate attributeName="r" from="16" to="22" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.15" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Cercle principal vert -->
        <circle cx="20" cy="20" r="14" fill="hsl(142 76% 36%)" filter="url(#shadow-pickup)"/>
        
        <!-- Bordure blanche -->
        <circle cx="20" cy="20" r="14" fill="none" stroke="white" stroke-width="3"/>
        
        <!-- Point central -->
        <circle cx="20" cy="20" r="3" fill="white"/>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || !window.google) return;

    const svgContent = getPickupSVG();
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

    if (!markerRef.current) {
      const marker = new google.maps.Marker({
        position,
        map,
        title: label || 'Point de départ',
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        zIndex: 1000,
        optimized: false
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setPosition(position);
    }
  }, [map, position, label]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}

export function DestinationMarker({ map, position, label }: Omit<MarkerProps, 'type'>) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  const getDestinationSVG = (): string => {
    return `
      <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-dest">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Cercle externe (le plus grand) -->
        <circle cx="28" cy="28" r="26" fill="hsl(357 85% 50%)" opacity="0.15" filter="url(#shadow-dest)"/>
        
        <!-- Cercle moyen -->
        <circle cx="28" cy="28" r="18" fill="hsl(357 85% 50%)" opacity="0.35"/>
        
        <!-- Cercle interne plein -->
        <circle cx="28" cy="28" r="10" fill="hsl(357 85% 50%)"/>
        
        <!-- Bordure blanche cercle interne -->
        <circle cx="28" cy="28" r="10" fill="none" stroke="white" stroke-width="3"/>
        
        <!-- Point central blanc -->
        <circle cx="28" cy="28" r="3" fill="white"/>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || !window.google) return;

    const svgContent = getDestinationSVG();
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

    if (!markerRef.current) {
      const marker = new google.maps.Marker({
        position,
        map,
        title: label || 'Destination',
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(56, 56),
          anchor: new google.maps.Point(28, 28)
        },
        zIndex: 1001,
        optimized: false
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setPosition(position);
    }
  }, [map, position, label]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}
