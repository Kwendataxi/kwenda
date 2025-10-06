import { useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface CustomMarkersProps {
  map: google.maps.Map;
  pickup?: Location | null;
  destination?: Location | null;
  currentDriverLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
}

export default function CustomMarkers({
  map,
  pickup,
  destination,
  currentDriverLocation,
  userLocation
}: CustomMarkersProps) {
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destinationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const userLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Marker de départ - Noir avec accent rouge Kwenda
  const createPickupMarkerContent = () => {
    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <div class="relative animate-bounce-subtle" style="filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));">
        <!-- Pulsations multiples noires/rouges -->
        <div class="absolute inset-0 rounded-full animate-ping opacity-40" style="background: linear-gradient(135deg, #1A1A1A, #EF4444);"></div>
        <div class="absolute inset-0 rounded-full animate-pulse-soft opacity-30" style="background: radial-gradient(circle, #EF4444 0%, #1A1A1A 100%);"></div>
        
        <!-- Marker principal 3D avec dégradé Kwenda -->
        <div class="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-white animate-pulse-soft" 
             style="background: linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 50%, #EF4444 100%); 
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1);">
          <!-- Icône pin avec effet lumineux -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="filter: drop-shadow(0 2px 8px rgba(239, 68, 68, 0.8));">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <!-- Point lumineux rouge au centre -->
          <div class="absolute w-3 h-3 bg-red-500 rounded-full animate-pulse" style="box-shadow: 0 0 12px #EF4444;"></div>
        </div>
        
        <!-- Label moderne Kwenda -->
        <div class="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold animate-slide-in-up border-2 border-white/30 font-montserrat"
             style="background: linear-gradient(135deg, #1A1A1A 0%, #EF4444 100%); 
                    color: white; 
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 20px rgba(239, 68, 68, 0.3);">
          📍 Point de départ
        </div>
      </div>
    `;
    return div;
  };

  // Marker de destination - Rouge éclatant Kwenda avec pulsation intense
  const createDestinationMarkerContent = () => {
    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <div class="relative animate-bounce-subtle" style="filter: drop-shadow(0 10px 20px rgba(239, 68, 68, 0.6));">
        <!-- Vagues multiples rouges intenses -->
        <div class="absolute inset-0 rounded-full animate-pulse opacity-60" style="background: radial-gradient(circle, #EF4444 0%, rgba(239, 68, 68, 0) 70%);"></div>
        <div class="absolute inset-0 rounded-full animate-ping opacity-50" style="background: #EF4444;"></div>
        <div class="absolute inset-0 rounded-full animate-pulse-soft opacity-40" style="background: linear-gradient(135deg, #DC2626, #EF4444, #F87171);"></div>
        
        <!-- Marker destination 3D rouge vif -->
        <div class="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-white" 
             style="background: linear-gradient(145deg, #DC2626 0%, #EF4444 50%, #F87171 100%); 
                    box-shadow: 0 16px 40px rgba(239, 68, 68, 0.7), 0 0 40px rgba(239, 68, 68, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.2);
                    animation: pulse-soft 2s ease-in-out infinite;">
          <!-- Icône check avec glow -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="filter: drop-shadow(0 2px 12px rgba(255, 255, 255, 0.8));">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <!-- Étoile brillante au centre -->
          <div class="absolute w-4 h-4 rounded-full animate-ping" style="background: radial-gradient(circle, white, #EF4444); box-shadow: 0 0 16px white;"></div>
        </div>
        
        <!-- Label destination éclatant -->
        <div class="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold animate-slide-in-up border-2 border-white/40 font-montserrat"
             style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%); 
                    color: white; 
                    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4);">
          🎯 Destination
        </div>
      </div>
    `;
    return div;
  };

  // Marker chauffeur - Noir élégant avec icône voiture blanche
  const createDriverMarkerContent = () => {
    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <div class="relative animate-bounce" style="filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5));">
        <!-- Pulse noir/rouge autour du chauffeur -->
        <div class="absolute inset-0 rounded-full animate-ping opacity-30" style="background: linear-gradient(135deg, #1A1A1A, #EF4444);"></div>
        
        <!-- Marker chauffeur noir premium -->
        <div class="flex items-center justify-center w-12 h-12 rounded-full border-3 border-white" 
             style="background: linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%); 
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3), inset 0 1px 4px rgba(255, 255, 255, 0.1);">
          <!-- Icône voiture blanche -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.5));">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
          <!-- Point rouge indicateur -->
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" style="box-shadow: 0 0 8px #EF4444;"></div>
        </div>
      </div>
    `;
    return div;
  };

  // Marker de départ
  useEffect(() => {
    if (!pickup) {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.map = null;
        pickupMarkerRef.current = null;
      }
      return;
    }

    const createMarker = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
      
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.map = null;
      }

      pickupMarkerRef.current = new AdvancedMarkerElement({
        map,
        position: { lat: pickup.lat, lng: pickup.lng },
        content: createPickupMarkerContent(),
        title: pickup.name || pickup.address
      });
    };

    createMarker();

    return () => {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.map = null;
      }
    };
  }, [pickup, map]);

  // Marker de destination
  useEffect(() => {
    if (!destination) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.map = null;
        destinationMarkerRef.current = null;
      }
      return;
    }

    const createMarker = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
      
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.map = null;
      }

      destinationMarkerRef.current = new AdvancedMarkerElement({
        map,
        position: { lat: destination.lat, lng: destination.lng },
        content: createDestinationMarkerContent(),
        title: destination.name || destination.address
      });
    };

    createMarker();

    return () => {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.map = null;
      }
    };
  }, [destination, map]);

  // Marker du chauffeur (si en mode tracking)
  useEffect(() => {
    if (!currentDriverLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.map = null;
        driverMarkerRef.current = null;
      }
      return;
    }

    const createMarker = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
      
      if (driverMarkerRef.current) {
        driverMarkerRef.current.position = currentDriverLocation;
      } else {
        driverMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: currentDriverLocation,
          content: createDriverMarkerContent(),
          title: 'Chauffeur'
        });
      }
    };

    createMarker();

    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.map = null;
      }
    };
  }, [currentDriverLocation, map]);

  // 🎯 Phase 3: Marker de position actuelle (bleu pulsant)
  const createUserLocationMarkerContent = () => {
    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <div class="relative animate-pulse" style="filter: drop-shadow(0 6px 16px rgba(59, 130, 246, 0.5));">
        <!-- Cercle de précision GPS -->
        <div class="absolute inset-0 rounded-full animate-ping opacity-40" style="background: radial-gradient(circle, #3B82F6, transparent);"></div>
        <div class="absolute -inset-8 rounded-full opacity-20 animate-pulse" style="background: radial-gradient(circle, #3B82F6 0%, transparent 70%); border: 2px dashed #3B82F6;"></div>
        
        <!-- Point bleu central -->
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-3 border-white" 
             style="background: linear-gradient(145deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%); 
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3);">
          <!-- Icône position -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4"/>
          </svg>
          <!-- Pulse central -->
          <div class="absolute w-2 h-2 bg-white rounded-full animate-ping" style="box-shadow: 0 0 10px white;"></div>
        </div>
        
        <!-- Label -->
        <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold animate-slide-in-up border-2 border-white/30"
             style="background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); 
                    color: white; 
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
          📍 Ma position
        </div>
      </div>
    `;
    return div;
  };

  // Marker position utilisateur
  useEffect(() => {
    if (!userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.map = null;
        userLocationMarkerRef.current = null;
      }
      return;
    }

    const createMarker = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
      
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.position = userLocation;
      } else {
        userLocationMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: userLocation,
          content: createUserLocationMarkerContent(),
          title: 'Ma position actuelle'
        });
      }
    };

    createMarker();

    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.map = null;
      }
    };
  }, [userLocation, map]);

  return null;
}
