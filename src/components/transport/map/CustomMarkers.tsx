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
}

export default function CustomMarkers({
  map,
  pickup,
  destination,
  currentDriverLocation
}: CustomMarkersProps) {
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destinationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Créer le SVG pour le marker de départ (vert avec pulse)
  const createPickupMarkerContent = () => {
    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <div class="relative">
        <!-- Pulse animation -->
        <div class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
        <!-- Main marker -->
        <div class="relative flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg border-4 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <!-- Label -->
        <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-md">
          Départ
        </div>
      </div>
    `;
    return div;
  };

  // Créer le SVG pour le marker de destination (rouge avec wave)
  const createDestinationMarkerContent = () => {
    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <div class="relative">
        <!-- Wave animation -->
        <div class="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></div>
        <!-- Main marker -->
        <div class="relative flex items-center justify-center w-12 h-12 bg-red-500 rounded-full shadow-lg border-4 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <!-- Label -->
        <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-md">
          Arrivée
        </div>
      </div>
    `;
    return div;
  };

  // Créer le SVG pour le marker du chauffeur (bleu avec rotation)
  const createDriverMarkerContent = () => {
    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <div class="relative">
        <div class="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full shadow-lg border-3 border-white animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
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

  return null;
}
