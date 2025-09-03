/**
 * Composant adapté utilisant IntelligentAddressSearch avec interface stabilisée
 * Résout les problèmes de focus et d'incompatibilité d'interface
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { IntelligentAddressSearch } from './IntelligentAddressSearch';
import { 
  UnifiedLocation, 
  LocationSelectCallback, 
  intelligentToUnified 
} from '@/types/locationAdapter';

interface AdaptedIntelligentSearchProps {
  placeholder?: string;
  onLocationSelect: LocationSelectCallback;
  showCurrentLocation?: boolean;
  showPopularPlaces?: boolean;
  showRecentSearches?: boolean;
  className?: string;
  value?: string;
  city?: string;
  autoFocus?: boolean;
}

export const AdaptedIntelligentSearch: React.FC<AdaptedIntelligentSearchProps> = ({
  placeholder = "Rechercher une adresse...",
  onLocationSelect,
  showCurrentLocation = true,
  showPopularPlaces = true,
  showRecentSearches = true,
  className,
  value,
  city = 'Kinshasa',
  autoFocus = false
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const componentRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  const handleLocationSelect = useCallback((result: any) => {
    const unified = intelligentToUnified(result);
    setInternalValue(unified.address);
    onLocationSelect(unified);
  }, [onLocationSelect]);

  // Stabiliser le focus en évitant les re-renders intempestifs
  const stableProps = {
    placeholder,
    onLocationSelect: handleLocationSelect,
    showCurrentLocation,
    showPopularPlaces,
    showRecentSearches,
    city,
    autoFocus
  };

  if (!isMounted) {
    return (
      <div className={`h-10 bg-muted animate-pulse rounded-md ${className}`} />
    );
  }

  return (
    <div ref={componentRef} className={className}>
      <IntelligentAddressSearch {...stableProps} />
    </div>
  );
};