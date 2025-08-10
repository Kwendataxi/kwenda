/**
 * Wrapper de compatibilité pour SmartLocationInput
 * Redirige vers UniversalLocationPicker pour uniformiser les interfaces
 * @deprecated - Utiliser UniversalLocationPicker directement
 */

import React from 'react';
import { UniversalLocationPicker } from './UniversalLocationPicker';
import { LocationData } from '@/services/MasterLocationService';

interface SmartLocationInputProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: LocationData) => void;
  showCurrentLocation?: boolean;
  enableManualFallback?: boolean;
  className?: string;
}

export const SmartLocationInput: React.FC<SmartLocationInputProps> = ({
  placeholder,
  value,
  onLocationSelect,
  showCurrentLocation = true,
  enableManualFallback = true,
  className
}) => {
  // Convertir la valeur string en LocationData si nécessaire
  const locationValue = value ? {
    address: value,
    lat: 0,
    lng: 0,
    type: 'geocoded' as const
  } : null;

  return (
    <UniversalLocationPicker
      value={locationValue}
      onLocationSelect={onLocationSelect}
      placeholder={placeholder}
      showCurrentLocation={showCurrentLocation}
      context="delivery"
      className={className}
    />
  );
};

export default SmartLocationInput;