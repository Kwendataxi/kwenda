import { useEffect, useRef } from 'react';

interface CurrentPositionMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number } | null;
  onClickPosition?: () => void;
  onDragEnd?: (newPosition: { lat: number; lng: number }) => void;
  isDraggable?: boolean;
}

export default function CurrentPositionMarker({ 
  map, 
  position, 
  onClickPosition, 
  onDragEnd,
  isDraggable = false 
}: CurrentPositionMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const manualPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const getModernPositionSVG = (): string => {
    return `
      <svg width="60" height="80" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="marker-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
          <linearGradient id="stem-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#DC2626;stop-opacity:0.6" />
          </linearGradient>
        </defs>
        
        <!-- Ombre portée au sol -->
        <ellipse cx="30" cy="76" rx="8" ry="2" fill="#000000" opacity="0.15"/>
        
        <!-- Pulse d'anneau rouge (animation) -->
        <circle cx="30" cy="28" r="28" fill="#EF4444" opacity="0.2">
          <animate attributeName="r" from="25" to="32" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Anneau extérieur rouge -->
        <circle cx="30" cy="28" r="22" fill="none" stroke="#EF4444" stroke-width="3" 
                filter="url(#marker-shadow)"/>
        
        <!-- Anneau intérieur blanc -->
        <circle cx="30" cy="28" r="16" fill="#FFFFFF" filter="url(#marker-shadow)"/>
        
        <!-- Point central rouge avec pulse -->
        <circle cx="30" cy="28" r="5" fill="#DC2626">
          <animate attributeName="r" from="4" to="6" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Tige verticale élégante -->
        <line x1="30" y1="50" x2="30" y2="74" stroke="url(#stem-gradient)" 
              stroke-width="2.5" stroke-linecap="round" filter="url(#marker-shadow)"/>
        
        <!-- Point d'ancrage au sol -->
        <circle cx="30" cy="75" r="3" fill="#DC2626" opacity="0.8"/>
      </svg>
    `;
  };

  const animateToPosition = (targetPosition: { lat: number; lng: number }) => {
    if (!markerRef.current) return;
    
    // Animation bounce de Google Maps
    markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
    
    // Animer vers la nouvelle position
    markerRef.current.setPosition(targetPosition);
    
    // Arrêter l'animation après 1s
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.setAnimation(null);
      }
    }, 1000);
  };

  useEffect(() => {
    console.log('🎯 [CurrentPositionMarker] Effect triggered:', {
      hasMap: !!map,
      hasPosition: !!position,
      position,
      hasGoogle: !!window.google,
      hasGoogleMaps: !!window.google?.maps,
      hasMarkerClass: !!window.google?.maps?.Marker,
      markerExists: !!markerRef.current
    });

    if (!map || !position || !window.google) {
      console.warn('⚠️ [CurrentPositionMarker] Marqueur non créé - conditions manquantes:', {
        map: !!map,
        position: !!position,
        google: !!window.google
      });
      return;
    }

    try {
      const svgContent = getModernPositionSVG();
      console.log('🎨 [CurrentPositionMarker] SVG généré, longueur:', svgContent.length);
      const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;

      if (!markerRef.current) {
        console.log('🎨 [CurrentPositionMarker] Création du marqueur à:', position);
        const marker = new google.maps.Marker({
        position,
        map,
        title: isDraggable ? 'Déplacez-moi ou cliquez pour me recentrer' : 'Votre position actuelle',
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(60, 80),
          anchor: new google.maps.Point(30, 75)
        },
        zIndex: 3000,
        optimized: false,
        clickable: true,
        draggable: isDraggable,
        cursor: isDraggable ? 'move' : 'pointer'
      });

      // Listener de clic
      marker.addListener('click', () => {
        console.log('📍 Position marker clicked:', position);
        onClickPosition?.();
      });

      // Listener de drag (si activé)
      if (isDraggable) {
        marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          const newPosition = {
            lat: event.latLng!.lat(),
            lng: event.latLng!.lng()
          };
          console.log('📍 Marqueur déplacé à:', newPosition);
          manualPositionRef.current = newPosition;
          onDragEnd?.(newPosition);
        });
      }

        markerRef.current = marker;
        console.log('✅ [CurrentPositionMarker] Marqueur créé avec succès');
      } else {
        // Détecter si c'est un retour à la position GPS
        const isDifferent = manualPositionRef.current && 
          (Math.abs(manualPositionRef.current.lat - position.lat) > 0.0001 ||
           Math.abs(manualPositionRef.current.lng - position.lng) > 0.0001);
        
        if (isDifferent) {
          // Animation de retour automatique
          console.log('🎯 Retour automatique à la position GPS');
          animateToPosition(position);
          manualPositionRef.current = null;
        } else {
          markerRef.current.setPosition(position);
        }
      }
    } catch (error) {
      console.error('❌ [CurrentPositionMarker] Erreur création marqueur:', error);
    }
  }, [map, position, onClickPosition, onDragEnd, isDraggable]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return null;
}
