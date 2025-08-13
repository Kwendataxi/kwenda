import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSimplifiedGeolocation } from '@/hooks/useSimplifiedGeolocation';
import { useSimplifiedDriverStatus } from '@/hooks/useSimplifiedDriverStatus';
import { useUnifiedDispatcher } from '@/hooks/useUnifiedDispatcher';
import { useAuth } from '@/hooks/useAuth';
import { 
  Activity, 
  MapPin, 
  Wifi, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverDiagnosticProps {
  className?: string;
}

const DriverDiagnostic: React.FC<DriverDiagnosticProps> = ({ className }) => {
  const { user } = useAuth();
  const { location, loading: locationLoading, error: locationError, getCurrentPosition, useDefaultPosition } = useSimplifiedGeolocation();
  const { status: driverStatus, loading: statusLoading } = useSimplifiedDriverStatus();
  const { dispatchStatus, loading: dispatchLoading, activeOrders, pendingNotifications } = useUnifiedDispatcher();
  
  const [testing, setTesting] = useState(false);

  const getStatusIcon = (condition: boolean, loading = false) => {
    if (loading) return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
    return condition ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const testAllSystems = async () => {
    setTesting(true);
    try {
      console.log('🔍 Test des systèmes...');
      
      // Test géolocalisation
      console.log('📍 Test géolocalisation...');
      try {
        await getCurrentPosition();
        console.log('✅ Géolocalisation OK');
      } catch (err) {
        console.log('⚠️ Géolocalisation échoué, utilisation position par défaut...');
        await useDefaultPosition();
      }
      
      // Test notification
      console.log('🔔 Simulation notification...');
      
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Diagnostic Chauffeur
          <Button 
            onClick={testAllSystems} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            {testing ? 'Test...' : 'Test Systèmes'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Authentication Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Authentification
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Utilisateur connecté</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(!!user)}
                <Badge variant={user ? "default" : "secondary"}>
                  {user ? user.email : 'Non connecté'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Geolocation Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Géolocalisation
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Service géolocalisation</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(navigator.geolocation !== undefined)}
                <Badge variant={navigator.geolocation ? "default" : "destructive"}>
                  {navigator.geolocation ? 'Supporté' : 'Non supporté'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Position actuelle</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(!!location, locationLoading)}
                <Badge variant={location ? "default" : "secondary"}>
                  {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Indisponible'}
                </Badge>
              </div>
            </div>
            
            {locationError && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800 text-xs">{locationError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Driver Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Statut Chauffeur
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>En ligne</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(driverStatus.isOnline, statusLoading)}
                <Badge variant={driverStatus.isOnline ? "default" : "secondary"}>
                  {driverStatus.isOnline ? 'Oui' : 'Non'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Disponible</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(driverStatus.isAvailable)}
                <Badge variant={driverStatus.isAvailable ? "default" : "secondary"}>
                  {driverStatus.isAvailable ? 'Oui' : 'Non'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Services: {driverStatus.serviceTypes.join(', ') || 'Aucun'}
          </div>
          
          {driverStatus.lastUpdate && (
            <div className="text-xs text-muted-foreground">
              Dernière MAJ: {driverStatus.lastUpdate.toLocaleTimeString('fr-FR')}
            </div>
          )}
        </div>

        {/* Orders & Notifications */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Commandes & Notifications
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Commandes actives</span>
              <Badge variant={activeOrders.length > 0 ? "default" : "secondary"}>
                {activeOrders.length}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant={pendingNotifications.length > 0 ? "default" : "secondary"}>
                {pendingNotifications.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <h4 className="text-sm font-medium">Informations techniques</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>User Agent: {navigator.userAgent.split(' ').slice(0, 3).join(' ')}...</div>
            <div>HTTPS: {window.location.protocol === 'https:' ? 'Oui' : 'Non'}</div>
            <div>Permissions API: {navigator.permissions ? 'Supporté' : 'Non supporté'}</div>
            <div>Connexion: {(navigator as any).connection?.effectiveType || 'Inconnue'}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex gap-2">
            <Button 
              onClick={() => getCurrentPosition()} 
              disabled={locationLoading}
              size="sm" 
              variant="outline"
            >
              Actualiser GPS
            </Button>
            <Button 
              onClick={useDefaultPosition} 
              size="sm" 
              variant="outline"
            >
              Position par défaut
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverDiagnostic;