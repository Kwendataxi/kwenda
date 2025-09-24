import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Share2, 
  Clock, 
  Star,
  Truck,
  Package,
  MessageCircle,
  RefreshCw,
  ChevronLeft,
  Info,
  User
} from 'lucide-react';
import { useUnifiedTrackingSystem } from '@/hooks/useUnifiedTrackingSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ModernTrackerProps {
  trackingId: string;
  trackingType: 'delivery' | 'taxi' | 'marketplace';
  onBack?: () => void;
  enableRealtimeLocation?: boolean;
}

export default function ModernTracker({ 
  trackingId, 
  trackingType, 
  onBack,
  enableRealtimeLocation = true 
}: ModernTrackerProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    trackingData,
    loading,
    error,
    connectionStatus,
    statusLabel,
    estimatedArrival,
    isCompleted,
    hasDriver,
    isActive,
    refreshTracking,
    contactDriver,
    shareLocation,
    lastUpdate
  } = useUnifiedTrackingSystem({
    trackingId,
    trackingType,
    autoRefresh: true,
    enableNotifications: true,
    realTimeLocation: enableRealtimeLocation
  });

  if (loading && !trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-muted rounded animate-pulse" />
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          </div>
          
          {/* Status Card Skeleton */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="w-32 h-8 bg-muted rounded animate-pulse" />
              <div className="w-full h-2 bg-muted rounded animate-pulse" />
              <div className="w-20 h-4 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
          
          {/* Driver Card Skeleton */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-16 h-3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-destructive/20 shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Erreur de chargement</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={refreshTracking} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!trackingData) return null;

  const getStatusColor = (status: string) => {
    if (isCompleted) return 'success';
    if (status === 'cancelled') return 'destructive';
    if (hasDriver) return 'primary';
    return 'secondary';
  };

  const getTypeIcon = () => {
    switch (trackingType) {
      case 'delivery': return <Package className="w-5 h-5" />;
      case 'taxi': return <Navigation className="w-5 h-5" />;
      default: return <Truck className="w-5 h-5" />;
    }
  };

  const handleOpenMap = () => {
    if (trackingData.driverLocation) {
      const { lat, lng } = trackingData.driverLocation;
      window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    } else {
      toast.info('Position du chauffeur non disponible');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/50 p-4 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="touch-manipulation">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <span className="font-medium">Suivi</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'reconnecting' ? 'bg-orange-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <Button variant="ghost" size="icon" onClick={refreshTracking} className="touch-manipulation">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{statusLabel}</h2>
                    <p className="text-sm text-muted-foreground">
                      #{trackingData.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(trackingData.status) as any} className="px-3 py-1">
                    {trackingData.progress}%
                  </Badge>
                </div>
                
                <Progress value={trackingData.progress} className="h-2" />
                
                {estimatedArrival && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Arrivée dans {estimatedArrival}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Driver Card */}
        {hasDriver && trackingData.driver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {trackingData.driver.avatar ? (
                        <img 
                          src={trackingData.driver.avatar} 
                          alt={trackingData.driver.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{trackingData.driver.name}</h3>
                      {trackingData.driver.vehicle && (
                        <p className="text-sm text-muted-foreground">
                          {trackingData.driver.vehicle.type}
                          {trackingData.driver.vehicle.plate && ` • ${trackingData.driver.vehicle.plate}`}
                        </p>
                      )}
                      {trackingData.driver.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {trackingData.driver.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={contactDriver} 
                      className="flex-1 h-12 touch-manipulation"
                      disabled={!trackingData.driver.phone}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 touch-manipulation">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Route Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-medium">Itinéraire</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Départ</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {trackingData.route.pickup.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l border-dashed border-muted-foreground/30 h-6" />
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Arrivée</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {trackingData.route.destination.address}
                      </p>
                    </div>
                  </div>
                </div>
                
                {trackingData.driverLocation && (
                  <Button 
                    onClick={handleOpenMap} 
                    variant="outline" 
                    className="w-full h-12 touch-manipulation"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Voir sur la carte
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Toggle */}
        <Button 
          variant="ghost" 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full justify-center"
        >
          {showDetails ? 'Masquer' : 'Plus de détails'}
        </Button>

        {/* Details Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-medium">Informations détaillées</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix</span>
                      <span className="font-medium">
                        {trackingData.pricing.amount.toLocaleString()} {trackingData.pricing.currency}
                      </span>
                    </div>
                    
                    {trackingData.metadata?.packageType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span>{trackingData.metadata.packageType}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Créé le</span>
                      <span>
                        {new Date(trackingData.timing.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    {lastUpdate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dernière MAJ</span>
                        <span>{lastUpdate.toLocaleTimeString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    onClick={shareLocation} 
                    variant="outline" 
                    className="w-full h-12 touch-manipulation"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager le suivi
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions - Fixed */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/50">
          <div className="max-w-md mx-auto">
            <Button 
              variant="destructive" 
              className="w-full h-12 touch-manipulation"
              onClick={() => toast.info('Annulation en cours...')}
            >
              Annuler la commande
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}