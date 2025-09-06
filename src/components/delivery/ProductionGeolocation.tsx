import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { masterLocationService } from '@/services/MasterLocationService';
import type { LocationData } from '@/types/location';
import { 
  Navigation, 
  MapPin, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  RefreshCw,
  Satellite
} from 'lucide-react';

interface ProductionGeolocationProps {
  onLocationDetected: (location: LocationData) => void;
  autoDetect?: boolean;
  showFallback?: boolean;
  className?: string;
}

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  source: 'gps' | 'ip' | 'fallback' | 'manual' | null;
}

const ProductionGeolocation: React.FC<ProductionGeolocationProps> = ({
  onLocationDetected,
  autoDetect = true,
  showFallback = true,
  className
}) => {
  const { toast } = useToast();
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    accuracy: null,
    source: null
  });

  // Géolocalisation robuste avec GPS natif HTML5
  const detectLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const location = await masterLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000, // Réduit à 10s pour éviter les timeouts
        maximumAge: 180000, // 3 minutes pour plus de réactivité
        fallbackToIP: true,
        fallbackToDatabase: true,
        fallbackToDefault: true
      });

      // Déterminer la source de la position
      let source: LocationState['source'] = 'fallback';
      if (location.type === 'current') source = 'gps';
      else if (location.type === 'ip') source = 'ip';
      else if (location.type === 'database') source = 'manual';

      setState({
        location,
        loading: false,
        error: null,
        accuracy: location.accuracy || null,
        source
      });

      onLocationDetected(location);

      // Feedback utilisateur selon la source
      if (source === 'gps') {
        toast({
          title: "📍 Position GPS détectée",
          description: `Précision: ${location.accuracy ? Math.round(location.accuracy) + 'm' : 'Bonne'}`,
        });
      } else if (source === 'ip') {
        toast({
          title: "🌐 Position approximative",
          description: "Basée sur votre connexion internet",
          variant: "default"
        });
      } else {
        toast({
          title: "📍 Position par défaut",
          description: "Vous pouvez rechercher une adresse précise",
          variant: "default"
        });
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de géolocalisation';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));

      toast({
        title: "Erreur de localisation",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [onLocationDetected, toast]);

  // Auto-détection au montage
  useEffect(() => {
    if (autoDetect && !state.location) {
      detectLocation();
    }
  }, [autoDetect, detectLocation, state.location]);

  // Adresses de fallback populaires par ville
  const fallbackAddresses = [
    { 
      address: "Centre-ville, Kinshasa, RDC", 
      lat: -4.3217, 
      lng: 15.3069,
      type: 'fallback' as const,
      name: "Centre-ville"
    },
    { 
      address: "Gombe, Kinshasa, RDC", 
      lat: -4.3166, 
      lng: 15.3056,
      type: 'fallback' as const,
      name: "Quartier Gombe"
    },
    { 
      address: "Bandalungwa, Kinshasa, RDC", 
      lat: -4.3732, 
      lng: 15.2988,
      type: 'fallback' as const,
      name: "Bandalungwa"
    }
  ];

  const handleFallbackSelect = (fallback: LocationData) => {
    setState(prev => ({
      ...prev,
      location: fallback,
      source: 'manual'
    }));
    onLocationDetected(fallback);
    
    toast({
      title: "📍 Position sélectionnée",
      description: fallback.address,
    });
  };

  const getSourceIcon = () => {
    switch (state.source) {
      case 'gps': return <Satellite className="h-4 w-4 text-green-600" />;
      case 'ip': return <Navigation className="h-4 w-4 text-blue-600" />;
      case 'manual': return <MapPin className="h-4 w-4 text-orange-600" />;
      default: return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSourceLabel = () => {
    switch (state.source) {
      case 'gps': return 'GPS précis';
      case 'ip': return 'Position approximative';
      case 'manual': return 'Position manuelle';
      default: return 'Position inconnue';
    }
  };

  return (
    <div className={className}>
      {/* Statut de la géolocalisation */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {state.loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : state.location ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {state.loading ? 'Localisation...' : 
                     state.location ? 'Position détectée' : 'Position non définie'}
                  </span>
                  {state.location && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getSourceIcon()}
                      <span className="text-xs">{getSourceLabel()}</span>
                    </Badge>
                  )}
                </div>
                
                {state.location && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {state.location.address}
                  </p>
                )}
                
                {state.error && (
                  <p className="text-xs text-destructive mt-1">
                    {state.error}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={detectLocation}
              disabled={state.loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              {state.loading ? 'Détection...' : 'Relocaliser'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Options de fallback si échec de géolocalisation */}
      {showFallback && (state.error || state.source === 'fallback') && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Choisir une position de référence
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Sélectionnez une zone connue pour commencer
              </p>
            </div>
            
            <div className="grid gap-2">
              {fallbackAddresses.map((fallback, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFallbackSelect(fallback)}
                  className="justify-start h-auto p-3 text-left"
                >
                  <div>
                    <div className="font-medium text-sm">{fallback.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {fallback.address}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductionGeolocation;