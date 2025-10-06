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

  // Créer un marker minimaliste et moderne
  const createModernMarker = (type: 'pickup' | 'destination' | 'user', label: string) => {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center;';

    // Cercles concentriques animés
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 2px solid ${type === 'destination' ? '#EF4444' : type === 'pickup' ? '#1A1A1A' : '#3B82F6'};
      opacity: 0;
      animation: ripple-effect 2s ease-out infinite;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    container.appendChild(ripple);

    // Marker principal - cercle plein moderne
    const marker = document.createElement('div');
    marker.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${
        type === 'destination' 
          ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
          : type === 'pickup'
          ? 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)'
          : 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
      };
      border: 3px solid white;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      position: relative;
      z-index: 1;
      transition: transform 0.3s ease;
      cursor: pointer;
    `;
    marker.innerHTML = type === 'destination' ? '🎯' : type === 'pickup' ? '📍' : '👤';
    
    marker.addEventListener('mouseenter', () => {
      marker.style.transform = 'scale(1.1)';
    });
    marker.addEventListener('mouseleave', () => {
      marker.style.transform = 'scale(1)';
    });

    container.appendChild(marker);

    // Label élégant uniquement pour pickup et destination
    if (type !== 'user') {
      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = `
        margin-top: 8px;
        padding: 8px 16px;
        background: ${type === 'destination' ? 'linear-gradient(135deg, #DC2626, #EF4444)' : 'linear-gradient(135deg, #1A1A1A, #2A2A2A)'};
        color: white;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
      `;
      labelDiv.textContent = label;
      container.appendChild(labelDiv);
    }

    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple-effect {
        0% {
          opacity: 0.6;
          transform: translate(-50%, -50%) scale(0.5);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(2);
        }
      }
    `;
    document.head.appendChild(style);

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

  // Créer/mettre à jour le marker user (minimaliste, sans label)
  useEffect(() => {
    if (!map || !userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }
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

        console.log('✅ User location marker created');
      } catch (error) {
        console.error('❌ Error creating user marker:', error);
      }
    };

    createUserMarker();
  }, [map, userLocation]);

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
