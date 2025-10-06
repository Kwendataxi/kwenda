import { useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface CustomMarkersProps {
  map: google.maps.Map | null;
  pickup?: Location | null;
  destination?: Location | null;
  userLocation?: { lat: number; lng: number } | null;
}

export default function CustomMarkers({
  map,
  pickup,
  destination,
  userLocation
}: CustomMarkersProps) {
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destinationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // 🎯 Créer un marker premium optimisé (35px, labels en dessous)
  const createModernMarker = (type: 'pickup' | 'destination' | 'user', label: string) => {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center;';

    // Ripple subtil
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: ${
        type === 'destination' 
          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.25), transparent)'
          : type === 'pickup'
          ? 'radial-gradient(circle, rgba(26, 26, 26, 0.2), transparent)'
          : 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent)'
      };
      opacity: 0;
      animation: ripple-pulse 2.5s ease-out infinite;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    container.appendChild(ripple);

    // Marker principal - 35px au lieu de 40px
    const marker = document.createElement('div');
    marker.style.cssText = `
      width: 35px;
      height: 35px;
      border-radius: 50%;
      background: ${
        type === 'destination' 
          ? 'linear-gradient(145deg, #DC2626, #EF4444)'
          : type === 'pickup'
          ? 'linear-gradient(145deg, #1A1A1A, #2A2A2A)'
          : 'linear-gradient(145deg, #2563EB, #3B82F6)'
      };
      border: 3px solid white;
      box-shadow: ${
        type === 'destination' 
          ? '0 6px 16px rgba(239, 68, 68, 0.4)'
          : type === 'pickup'
          ? '0 6px 16px rgba(0, 0, 0, 0.35)'
          : '0 6px 16px rgba(59, 130, 246, 0.4)'
      };
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      position: relative;
      z-index: 10;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    `;
    marker.innerHTML = type === 'destination' ? '🎯' : type === 'pickup' ? '📍' : '👤';
    
    // Hover effect premium
    marker.addEventListener('mouseenter', () => {
      marker.style.transform = 'scale(1.08)';
      marker.style.boxShadow = type === 'destination' 
        ? '0 8px 20px rgba(239, 68, 68, 0.6)'
        : type === 'pickup'
        ? '0 8px 20px rgba(0, 0, 0, 0.5)'
        : '0 8px 20px rgba(59, 130, 246, 0.6)';
    });
    marker.addEventListener('mouseleave', () => {
      marker.style.transform = 'scale(1)';
      marker.style.boxShadow = type === 'destination' 
        ? '0 6px 16px rgba(239, 68, 68, 0.4)'
        : type === 'pickup'
        ? '0 6px 16px rgba(0, 0, 0, 0.35)'
        : '0 6px 16px rgba(59, 130, 246, 0.4)';
    });

    container.appendChild(marker);

    // Label élégant EN DESSOUS uniquement pour pickup et destination
    if (type !== 'user' && label) {
      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = `
        margin-top: 8px;
        padding: 6px 12px;
        background: ${type === 'destination' ? 'linear-gradient(135deg, #DC2626, #EF4444)' : 'linear-gradient(135deg, #1A1A1A, #2A2A2A)'};
        color: white;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 4px 12px ${type === 'destination' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 0, 0, 0.4)'};
        border: 1.5px solid rgba(255, 255, 255, ${type === 'destination' ? '0.3' : '0.2'});
      `;
      labelDiv.textContent = label;
      container.appendChild(labelDiv);
    }

    // Animation CSS
    if (!document.getElementById('marker-animations-premium')) {
      const style = document.createElement('style');
      style.id = 'marker-animations-premium';
      style.textContent = `
        @keyframes ripple-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.4;
          }
          50% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.2;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return container;
  };

  // Créer/mettre à jour le marker pickup
  useEffect(() => {
    if (!map || !pickup) {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.map = null;
        pickupMarkerRef.current = null;
      }
      return;
    }

    const createPickupMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
        
        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.map = null;
        }

        const content = createModernMarker('pickup', 'Point de départ');
        
        pickupMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: { lat: pickup.lat, lng: pickup.lng },
          content,
          title: 'Point de départ',
        });

        console.log('✅ Pickup marker created');
      } catch (error) {
        console.error('❌ Error creating pickup marker:', error);
      }
    };

    createPickupMarker();
  }, [map, pickup]);

  // Créer/mettre à jour le marker destination
  useEffect(() => {
    if (!map || !destination) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.map = null;
        destinationMarkerRef.current = null;
      }
      return;
    }

    const createDestinationMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
        
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.map = null;
        }

        const content = createModernMarker('destination', 'Destination');
        
        destinationMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: { lat: destination.lat, lng: destination.lng },
          content,
          title: 'Destination',
        });

        console.log('✅ Destination marker created');
      } catch (error) {
        console.error('❌ Error creating destination marker:', error);
      }
    };

    createDestinationMarker();
  }, [map, destination]);

  // 🔵 User marker - Masqué si pickup existe (éviter superposition)
  useEffect(() => {
    // ✅ LOGIQUE PREMIUM: Ne pas afficher userLocation si pickup existe
    if (!map || !userLocation || pickup) {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }
      console.log('ℹ️ User marker masqué:', !userLocation ? 'pas de position' : 'pickup existe - éviter superposition');
      return;
    }

    const createUserMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
        
        if (userMarkerRef.current) {
          userMarkerRef.current.map = null;
        }

        const content = createModernMarker('user', '');
        
        userMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: { lat: userLocation.lat, lng: userLocation.lng },
          content,
          title: 'Ma position',
        });

        console.log('✅ User marker affiché (pas de pickup sélectionné)');
      } catch (error) {
        console.error('❌ Error creating user marker:', error);
      }
    };

    createUserMarker();
  }, [map, userLocation, pickup]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
      if (destinationMarkerRef.current) destinationMarkerRef.current.map = null;
      if (userMarkerRef.current) userMarkerRef.current.map = null;
    };
  }, []);

  return null;
}
