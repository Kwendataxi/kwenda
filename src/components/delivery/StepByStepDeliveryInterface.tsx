import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';
import { CountryService } from '@/services/countryConfig';
import { GeocodingService } from '@/services/geocoding';
import { usePriceEstimator } from '@/hooks/usePricingRules';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLocationSearch } from '@/components/delivery/EnhancedLocationSearch';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { useEnhancedDeliveryOrders, DeliveryLocation, DeliveryOrderData } from '@/hooks/useEnhancedDeliveryOrders';
import { GoogleMapsService } from '@/services/googleMapsService';
import ModernDeliveryInterface from './ModernDeliveryInterface';
import { 
  ArrowLeft,
  ArrowRight,
  MapPin, 
  Target,
  Bike,
  Car,
  Truck,
  CheckCircle2,
  Navigation2,
  Clock,
  Package,
  Zap,
  Route,
  Building,
  Plane,
  ChevronRight
} from 'lucide-react';

interface DeliveryOption {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  icon: any;
  time: string;
  description: string;
  features: string[];
  priceEstimator: (distance: number) => number;
}

interface StepByStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

type DeliveryStep = 'city' | 'pickup' | 'destination' | 'mode' | 'confirmation';

const StepByStepDeliveryInterface = ({ onSubmit, onCancel }: StepByStepDeliveryInterfaceProps) => {
  // Interface moderne simplifiée avec 3 étapes claires
  return <ModernDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default StepByStepDeliveryInterface;