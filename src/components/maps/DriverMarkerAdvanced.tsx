/**
 * 🚗 Marker Chauffeur 3D Avancé
 * Marker de véhicule avec rotation fluide, badge chauffeur et animation de déplacement
 */

import { useEffect, useRef, useState } from 'react';
import { DriverMarkerConfig } from '@/types/map';

interface DriverMarkerAdvancedProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  heading: number; // Direction en degrés (0-360)
  driverName?: string;
  driverPhoto?: string;
  vehicleModel?: string;
  speed?: number;
  smoothTransition?: boolean;
}

export default function DriverMarkerAdvanced({
  map,
  position,
  heading,
  driverName = 'Chauffeur',
  driverPhoto,
  vehicleModel,
  speed = 0,
  smoothTransition = true
}: DriverMarkerAdvancedProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const previousPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentHeading, setCurrentHeading] = useState(heading);

  // Interpoler la position pour un mouvement fluide
  const animateToPosition = (
    startPos: { lat: number; lng: number },
    endPos: { lat: number; lng: number },
    duration: number = 1000
  ) => {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentLat = startPos.lat + (endPos.lat - startPos.lat) * eased;
      const currentLng = startPos.lng + (endPos.lng - startPos.lng) * eased;
      
      if (markerRef.current) {
        markerRef.current.setPosition({ lat: currentLat, lng: currentLng });
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // SVG du véhicule avec rotation
  const getVehicleSVG = (rotation: number, isMoving: boolean): string => {
    return `
      <svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-vehicle" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="0" dy="6" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="grad-vehicle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="grad-accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ec2027;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <g transform="translate(32, 60)" filter="url(#shadow-vehicle)">
          <!-- Ombre sous le véhicule -->
          <ellipse cx="0" cy="12" rx="20" ry="8" fill="black" opacity="0.2"/>
          
          <!-- Groupe rotatif du véhicule -->
          <g transform="rotate(${rotation})">
            <!-- Corps du véhicule (vue de dessus stylisée) -->
            <path d="M -12 -24 L -14 -8 L -14 12 L -12 16 L 12 16 L 14 12 L 14 -8 L 12 -24 Z" 
                  fill="url(#grad-vehicle)" 
                  stroke="white" 
                  stroke-width="1.5"/>
            
            <!-- Fenêtres -->
            <rect x="-10" y="-20" width="20" height="12" rx="2" fill="#3b82f6" opacity="0.4"/>
            
            <!-- Capot avec accent Kwenda -->
            <path d="M -10 -20 L -8 -8 L 8 -8 L 10 -20 Z" 
                  fill="url(#grad-accent)" 
                  opacity="0.9"/>
            
            <!-- Phares -->
            <circle cx="-8" cy="-22" r="2" fill="#fbbf24" opacity="0.8"/>
            <circle cx="8" cy="-22" r="2" fill="#fbbf24" opacity="0.8"/>
            
            <!-- Indicateur de mouvement -->
            ${isMoving ? `
              <g opacity="0.6">
                <line x1="0" y1="-28" x2="0" y2="-32" stroke="#ec2027" stroke-width="2" stroke-linecap="round">
                  <animate attributeName="y1" from="-28" to="-24" dur="0.5s" repeatCount="indefinite"/>
                  <animate attributeName="y2" from="-32" to="-28" dur="0.5s" repeatCount="indefinite"/>
                </line>
              </g>
            ` : ''}
          </g>
        </g>
        
        <!-- Badge chauffeur -->
        <g transform="translate(32, 8)">
          <rect x="-22" y="-8" width="44" height="16" rx="8" 
                fill="white" 
                stroke="#e5e7eb" 
                stroke-width="1"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>
          <text x="0" y="2" 
                text-anchor="middle" 
                font-family="system-ui, -apple-system" 
                font-size="9" 
                font-weight="600"
                fill="#1f2937">
            ${driverName.split(' ')[0].substring(0, 10)}
          </text>
        </g>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || !window.google) return;

    const isMoving = speed > 0.5; // Considéré en mouvement si > 0.5 km/h
    const svgContent = getVehicleSVG(currentHeading, isMoving);
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

    if (!markerRef.current) {
      // Créer le marker initial
      const marker = new google.maps.Marker({
        position,
        map,
        title: `${driverName}${vehicleModel ? ` - ${vehicleModel}` : ''}`,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(64, 80),
          anchor: new google.maps.Point(32, 60)
        },
        zIndex: 1000,
        optimized: false
      });

      markerRef.current = marker;
      previousPositionRef.current = position;

      // InfoWindow au clic
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 200px;">
            <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 4px;">
              ${driverName}
            </div>
            ${vehicleModel ? `
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                ${vehicleModel}
              </div>
            ` : ''}
            <div style="display: flex; gap: 8px; font-size: 12px; color: #6b7280;">
              <div>🧭 ${Math.round(heading)}°</div>
              ${speed > 0 ? `<div>⚡ ${speed.toFixed(1)} km/h</div>` : ''}
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    } else {
      // Mettre à jour l'icône pour refléter le nouveau heading
      markerRef.current.setIcon({
        url: iconUrl,
        scaledSize: new google.maps.Size(64, 80),
        anchor: new google.maps.Point(32, 60)
      });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [map, currentHeading, driverName, vehicleModel, speed]);

  // Mise à jour de la position avec animation fluide
  useEffect(() => {
    if (!markerRef.current || !position) return;

    if (smoothTransition && previousPositionRef.current) {
      // Calculer la distance pour déterminer la durée de l'animation
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(previousPositionRef.current),
        new google.maps.LatLng(position)
      );

      // Animation plus courte pour petites distances
      const duration = Math.min(Math.max(distance * 10, 500), 2000);
      
      animateToPosition(previousPositionRef.current, position, duration);
    } else {
      markerRef.current.setPosition(position);
    }

    previousPositionRef.current = position;
  }, [position, smoothTransition]);

  // Mise à jour du heading avec interpolation fluide
  useEffect(() => {
    // Interpoler la rotation pour éviter les sauts brusques
    const interpolateHeading = (from: number, to: number): number => {
      let diff = to - from;
      
      // Normaliser pour choisir le chemin le plus court
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      return from + diff;
    };

    const targetHeading = interpolateHeading(currentHeading, heading);
    
    // Animation douce du heading
    const headingSteps = 10;
    const headingIncrement = (targetHeading - currentHeading) / headingSteps;
    let currentStep = 0;

    const headingInterval = setInterval(() => {
      currentStep++;
      setCurrentHeading(prev => {
        const newHeading = prev + headingIncrement;
        return ((newHeading % 360) + 360) % 360; // Normaliser 0-360
      });

      if (currentStep >= headingSteps) {
        clearInterval(headingInterval);
        setCurrentHeading(heading);
      }
    }, 50);

    return () => clearInterval(headingInterval);
  }, [heading]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}
