/**
 * 🎯 Marker Animé Moderne pour Google Maps
 * Markers 3D avec animations fluides et effets visuels premium
 */

import { useEffect, useRef, useState } from 'react';
import { MarkerType, AnimatedMarkerConfig } from '@/types/map';

interface CustomAnimatedMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  type: MarkerType;
  label?: string;
  onClick?: () => void;
  animation?: 'bounce' | 'drop' | 'pulse';
}

// SVG pour différents types de markers
const getMarkerSVG = (type: MarkerType, isPulsing: boolean = false): string => {
  const pulseClass = isPulsing ? 'animate-pulse' : '';
  
  switch (type) {
    case 'pickup':
      return `
        <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow-pickup" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="4" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="grad-pickup" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
            </linearGradient>
          </defs>
          <g filter="url(#shadow-pickup)">
            <path d="M24 0C10.745 0 0 10.745 0 24C0 42 24 56 24 56S48 42 48 24C48 10.745 37.255 0 24 0Z" 
                  fill="url(#grad-pickup)"/>
            <circle cx="24" cy="24" r="12" fill="white" opacity="0.95"/>
            <circle cx="24" cy="24" r="6" fill="#10b981"/>
          </g>
          ${isPulsing ? `
            <circle cx="24" cy="24" r="18" fill="none" stroke="#10b981" stroke-width="2" opacity="0.6">
              <animate attributeName="r" from="18" to="28" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
        </svg>
      `;
    
    case 'destination':
      return `
        <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow-dest" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="4" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="grad-dest" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
            </linearGradient>
            <filter id="glow-dest">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#shadow-dest)">
            <path d="M24 0C10.745 0 0 10.745 0 24C0 42 24 56 24 56S48 42 48 24C48 10.745 37.255 0 24 0Z" 
                  fill="url(#grad-dest)" filter="url(#glow-dest)"/>
            <circle cx="24" cy="24" r="12" fill="white" opacity="0.95"/>
            <path d="M24 18 L30 24 L24 30 L18 24 Z" fill="#ef4444"/>
          </g>
        </svg>
      `;
    
    case 'user':
      return `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="grad-user">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="16" fill="url(#grad-user)">
            <animate attributeName="r" from="14" to="20" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.8" to="0.2" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="16" cy="16" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
        </svg>
      `;
    
    default:
      return `
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" 
                fill="#6b7280"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `;
  }
};

export default function CustomAnimatedMarker({ 
  map, 
  position, 
  type, 
  label,
  onClick,
  animation = 'drop'
}: CustomAnimatedMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isPulsing, setIsPulsing] = useState(type === 'user');

  useEffect(() => {
    if (!map || !window.google) return;

    // Créer le marker avec SVG personnalisé
    const svgContent = getMarkerSVG(type, isPulsing);
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;
    
    const markerOptions: google.maps.MarkerOptions = {
      position,
      map,
      title: label,
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(
          type === 'user' ? 32 : 48, 
          type === 'user' ? 32 : 56
        ),
        anchor: new google.maps.Point(
          type === 'user' ? 16 : 24, 
          type === 'user' ? 16 : 56
        )
      },
      zIndex: type === 'driver' ? 1000 : type === 'user' ? 999 : 500,
      optimized: false // Nécessaire pour les SVG animés
    };

    // Animation d'apparition
    if (animation === 'drop') {
      markerOptions.animation = google.maps.Animation.DROP;
    } else if (animation === 'bounce') {
      markerOptions.animation = google.maps.Animation.BOUNCE;
      // Arrêter le bounce après 2 secondes
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.setAnimation(null);
        }
      }, 2000);
    }

    const marker = new google.maps.Marker(markerOptions);
    markerRef.current = marker;

    // Gestionnaire de clic
    if (onClick) {
      marker.addListener('click', onClick);
    }

    // Label personnalisé si fourni
    if (label && type !== 'user') {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px; font-weight: 500; color: #1f2937;">${label}</div>`
      });
      
      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });
      
      marker.addListener('mouseout', () => {
        infoWindow.close();
      });
    }

    return () => {
      marker.setMap(null);
    };
  }, [map, position, type, label, onClick, animation, isPulsing]);

  // Mise à jour de la position avec animation fluide
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setPosition(position);
    }
  }, [position]);

  return null;
}
