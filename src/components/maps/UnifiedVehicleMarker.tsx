/**
 * 🚗 Marqueur véhicule unifié avec animation fluide
 * Gère taxi, moto, van et camion avec rotation et transitions
 */

import { useEffect, useRef, useState } from 'react';
import { TrackedVehicle } from '@/hooks/useUnifiedVehicleTracking';
import { 
  getVehicleSVG, 
  svgToDataUrl,
  VehicleType 
} from './VehicleMarkerIcons';
import { 
  VehicleAnimationController,
  interpolateHeading 
} from '@/utils/vehicleAnimationUtils';

interface UnifiedVehicleMarkerProps {
  map: google.maps.Map | null;
  vehicle: TrackedVehicle;
  smoothTransition?: boolean;
  onClick?: (vehicle: TrackedVehicle) => void;
}

export default function UnifiedVehicleMarker({
  map,
  vehicle,
  smoothTransition = true,
  onClick
}: UnifiedVehicleMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const animationControllerRef = useRef<VehicleAnimationController | null>(null);
  const [displayHeading, setDisplayHeading] = useState(vehicle.heading);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Créer/mettre à jour le marker
  useEffect(() => {
    if (!map || !window.google) return;

    const position = { lat: vehicle.lat, lng: vehicle.lng };
    const svgContent = getVehicleSVG(
      vehicle.vehicle_class,
      displayHeading,
      vehicle.status,
      vehicle.is_delivering
    );
    const iconUrl = svgToDataUrl(svgContent);

    if (!markerRef.current) {
      // Créer le marker initial
      const marker = new google.maps.Marker({
        position,
        map,
        title: vehicle.driver_name || `${vehicle.vehicle_class} - ${vehicle.id.slice(0, 8)}`,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(56, 72),
          anchor: new google.maps.Point(28, 48)
        },
        zIndex: vehicle.status === 'available' ? 1000 : 900,
        optimized: false
      });

      markerRef.current = marker;
      lastPositionRef.current = position;
      
      // Initialiser le contrôleur d'animation
      animationControllerRef.current = new VehicleAnimationController(
        position,
        displayHeading
      );

      // InfoWindow au clic
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(vehicle)
      });
      infoWindowRef.current = infoWindow;

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        onClick?.(vehicle);
      });
    } else {
      // Mettre à jour l'icône
      markerRef.current.setIcon({
        url: iconUrl,
        scaledSize: new google.maps.Size(56, 72),
        anchor: new google.maps.Point(28, 48)
      });

      // Mettre à jour le contenu de l'InfoWindow
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(createInfoWindowContent(vehicle));
      }
    }

    return () => {
      // Cleanup géré dans un autre useEffect
    };
  }, [map, displayHeading, vehicle.status, vehicle.is_delivering, vehicle.vehicle_class]);

  // Animer la position
  useEffect(() => {
    if (!markerRef.current || !animationControllerRef.current) return;

    const newPosition = { lat: vehicle.lat, lng: vehicle.lng };
    
    if (smoothTransition && lastPositionRef.current) {
      // Animation fluide vers la nouvelle position
      animationControllerRef.current.moveTo(
        markerRef.current,
        newPosition,
        vehicle.heading
      );
    } else {
      markerRef.current.setPosition(newPosition);
    }

    lastPositionRef.current = newPosition;
  }, [vehicle.lat, vehicle.lng, smoothTransition]);

  // Animer le heading
  useEffect(() => {
    // Interpoler le heading pour éviter les sauts
    const diff = interpolateHeading(displayHeading, vehicle.heading);
    
    if (Math.abs(diff) < 1) {
      setDisplayHeading(vehicle.heading);
      return;
    }

    const steps = 10;
    const increment = diff / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setDisplayHeading(prev => {
        const newHeading = prev + increment;
        return ((newHeading % 360) + 360) % 360;
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayHeading(vehicle.heading);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [vehicle.heading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (animationControllerRef.current) {
        animationControllerRef.current.stop();
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  return null;
}

/**
 * Crée le contenu HTML de l'InfoWindow
 */
function createInfoWindowContent(vehicle: TrackedVehicle): string {
  const typeLabels: Record<VehicleType, string> = {
    taxi: '🚕 Taxi',
    moto_flash: '🏍️ Moto Flash',
    van_flex: '🚐 Van Flex',
    truck_maxicharge: '🚚 MaxiCharge'
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    available: { label: 'Disponible', color: '#22C55E' },
    busy: { label: 'En course', color: '#F59E0B' },
    offline: { label: 'Hors ligne', color: '#6B7280' }
  };

  const status = statusLabels[vehicle.status] || statusLabels.offline;

  return `
    <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
      <!-- Header -->
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        ${vehicle.driver_photo ? `
          <img 
            src="${vehicle.driver_photo}" 
            alt="${vehicle.driver_name || 'Chauffeur'}"
            style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb;"
          />
        ` : `
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            👤
          </div>
        `}
        <div>
          <div style="font-weight: 600; font-size: 14px; color: #1f2937;">
            ${vehicle.driver_name || 'Chauffeur'}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            ${typeLabels[vehicle.vehicle_class]}
          </div>
        </div>
      </div>
      
      <!-- Status badge -->
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 9999px; background: ${status.color}20; margin-bottom: 12px;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${status.color};"></div>
        <span style="font-size: 12px; font-weight: 500; color: ${status.color};">${status.label}</span>
      </div>
      
      <!-- Infos -->
      <div style="display: flex; gap: 16px; font-size: 12px; color: #6b7280;">
        <div style="display: flex; align-items: center; gap: 4px;">
          🧭 ${Math.round(vehicle.heading)}°
        </div>
        ${vehicle.speed > 0 ? `
          <div style="display: flex; align-items: center; gap: 4px;">
            ⚡ ${vehicle.speed.toFixed(1)} km/h
          </div>
        ` : ''}
        ${vehicle.vehicle_model ? `
          <div style="display: flex; align-items: center; gap: 4px;">
            🚗 ${vehicle.vehicle_model}
          </div>
        ` : ''}
      </div>
      
      ${vehicle.is_delivering ? `
        <div style="margin-top: 12px; padding: 8px; background: #ECFDF5; border-radius: 8px; font-size: 12px; color: #059669;">
          📦 Livraison en cours
          ${vehicle.delivery_status ? ` - ${
            vehicle.delivery_status === 'pickup' ? 'Récupération' :
            vehicle.delivery_status === 'in_transit' ? 'En route' : 'Livré'
          }` : ''}
        </div>
      ` : ''}
    </div>
  `;
}
