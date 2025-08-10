import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TouchOptimizedButton, SwipeableCard } from './TouchOptimizedInterface';
import { DriverQuickActions } from '../driver/DriverQuickActions';
import { MobileOptimizer } from '@/components/performance/MobileOptimizer';
import { LazyLoadWrapper } from '@/components/performance/LazyLoadWrapper';
import { OptimizedGrid } from '@/components/performance/OptimizedGrid';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useDriverData } from '@/hooks/useDriverData';
import { useDriverRideOffers } from '@/hooks/useDriverRideOffers';
import { useBackgroundTracking } from '@/hooks/useBackgroundTracking';
import { 
  Car, 
  MapPin, 
  Clock, 
  Star, 
  User, 
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle,
  Navigation,
  Zap,
  Activity,
  TrendingUp
} from 'lucide-react';

interface MobileDriverInterfaceProps {
  onNavigateToEarnings: () => void;
  onNavigateToCredits: () => void;
  onNavigateToNavigation: () => void;
}

export const MobileDriverInterface: React.FC<MobileDriverInterfaceProps> = ({
  onNavigateToEarnings,
  onNavigateToCredits,
  onNavigateToNavigation
}) => {
  const { metrics, isSlowConnection, isLowBattery } = usePerformanceMonitor();
  const { stats, isOnline, updateOnlineStatus } = useDriverData();
  const { activeBooking, pendingRequests, acceptBooking, updateBookingStatus } = useDriverRideOffers();
  const { isTracking, start, stop, supported } = useBackgroundTracking({ distanceFilterMeters: 25, minIntervalMs: 10000 });
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'ride' | 'request'>('dashboard');

  // Auto-switch to ride view when there's an active booking
  useEffect(() => {
    if (activeBooking) {
      setCurrentView('ride');
    } else if (pendingRequests.length > 0) {
      setCurrentView('request');
    } else {
      setCurrentView('dashboard');
    }
  }, [activeBooking, pendingRequests]);

  const renderPerformanceIndicator = () => (
    <div className="flex items-center gap-2 mb-4">
      {isSlowConnection && (
        <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
          <Zap className="w-3 h-3 mr-1" />
          Connexion lente
        </Badge>
      )}
      {isLowBattery && (
        <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
          Batterie faible
        </Badge>
      )}
    </div>
  );

  const renderCompactStats = () => (
    <LazyLoadWrapper immediate>
      <OptimizedGrid 
        className="grid-cols-3 gap-3 mb-6"
        itemsPerPage={3}
        fullRender
        showNotice={false}
      >
        {[
          {
            icon: DollarSign,
            label: "Aujourd'hui",
            value: `${(stats.today_earnings || 0).toLocaleString()} FC`,
            bgColor: "bg-green-50",
            iconColor: "text-green-600"
          },
          {
            icon: Car,
            label: "Courses",
            value: stats.total_rides || 0,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600"
          },
          {
            icon: Clock,
            label: "Temps",
            value: `${stats.hours_online || 0}h`,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600"
          }
        ].map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-sm font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </OptimizedGrid>
    </LazyLoadWrapper>
  );

  const renderQuickActions = () => (
    <LazyLoadWrapper immediate>
      <DriverQuickActions
        onNavigateToEarnings={onNavigateToEarnings}
        onNavigateToCredits={onNavigateToCredits}
        isTracking={isTracking}
        onToggleTracking={() => (isTracking ? stop() : start())}
        className="mb-6"
      />
    </LazyLoadWrapper>
  );

  const renderRideRequest = () => {
    const request = pendingRequests[0];
    if (!request) return null;

    return (
      <SwipeableCard
        onSwipeLeft={() => updateOnlineStatus(false)}
        onSwipeRight={() => acceptBooking(request.id)}
        className="animate-scale-in shadow-lg"
      >
        <CardHeader className="text-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
          <CardTitle className="text-lg">Nouvelle demande</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg">{request.user_name || 'Client'}</h3>
            <div className="flex items-center justify-center mt-2">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="font-medium">{request.user_rating || 4.8}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full mt-1" />
              <div>
                <p className="font-semibold">Départ</p>
                <p className="text-sm text-muted-foreground">{request.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mt-1" />
              <div>
                <p className="font-semibold">Destination</p>
                <p className="text-sm text-muted-foreground">{request.destination}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="font-bold">12.5 km</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Estimation</p>
              <p className="font-bold">{request.estimated_price?.toLocaleString()} FC</p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <TouchOptimizedButton
              variant="outline"
              className="flex-1 h-12"
              onClick={() => updateOnlineStatus(false)}
              hapticFeedback="medium"
            >
              Refuser
            </TouchOptimizedButton>
            <TouchOptimizedButton
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80"
              onClick={() => acceptBooking(request.id)}
              hapticFeedback="heavy"
            >
              Accepter
            </TouchOptimizedButton>
          </div>

          <div className="flex justify-center gap-4">
            <TouchOptimizedButton variant="ghost" size="md" className="w-12 h-12 rounded-xl">
              <Phone className="h-5 w-5" />
            </TouchOptimizedButton>
            <TouchOptimizedButton variant="ghost" size="md" className="w-12 h-12 rounded-xl">
              <MessageCircle className="h-5 w-5" />
            </TouchOptimizedButton>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              ← Glissez à gauche pour refuser | Glissez à droite pour accepter →
            </p>
          </div>
        </CardContent>
      </SwipeableCard>
    );
  };

  const renderActiveRide = () => {
    if (!activeBooking) return null;

    return (
      <LazyLoadWrapper immediate>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Course en cours</CardTitle>
              <Badge className={
                activeBooking.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                activeBooking.status === 'driver_arrived' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }>
                {activeBooking.status === 'accepted' && '🚗 En route'}
                {activeBooking.status === 'driver_arrived' && '📍 Arrivé'}
                {activeBooking.status === 'in_progress' && '🏁 En cours'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{activeBooking.user_name}</h3>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm">{activeBooking.user_rating || 4.8}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <TouchOptimizedButton variant="ghost" size="sm" className="w-10 h-10">
                  <Phone className="h-4 w-4" />
                </TouchOptimizedButton>
                <TouchOptimizedButton variant="ghost" size="sm" className="w-10 h-10">
                  <MessageCircle className="h-4 w-4" />
                </TouchOptimizedButton>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm">{activeBooking.pickup_location}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm">{activeBooking.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {activeBooking.status === 'accepted' && (
                <TouchOptimizedButton
                  onClick={() => updateBookingStatus('driver_arrived')}
                  className="col-span-2 h-12"
                  hapticFeedback="heavy"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Je suis arrivé
                </TouchOptimizedButton>
              )}
              {activeBooking.status === 'driver_arrived' && (
                <TouchOptimizedButton
                  onClick={() => updateBookingStatus('in_progress')}
                  className="col-span-2 h-12"
                  hapticFeedback="heavy"
                >
                  Commencer la course
                </TouchOptimizedButton>
              )}
              {activeBooking.status === 'in_progress' && (
                <TouchOptimizedButton
                  onClick={() => updateBookingStatus('completed')}
                  className="col-span-2 h-12 bg-green-600 hover:bg-green-700"
                  hapticFeedback="heavy"
                >
                  Terminer la course
                </TouchOptimizedButton>
              )}
              <TouchOptimizedButton
                variant="outline"
                onClick={onNavigateToNavigation}
                className="col-span-2 h-12 mt-2"
                hapticFeedback="medium"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Ouvrir la navigation
              </TouchOptimizedButton>
            </div>
          </CardContent>
        </Card>
      </LazyLoadWrapper>
    );
  };

  return (
    <MobileOptimizer>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Performance indicators */}
        {renderPerformanceIndicator()}

        {/* Online status toggle */}
        <div className="mb-6">
          <TouchOptimizedButton
            variant={isOnline ? "default" : "outline"}
            onClick={() => updateOnlineStatus(!isOnline)}
            className={`w-full h-14 font-medium transition-all duration-300 ${
              isOnline 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "border-2 hover:border-green-500 hover:bg-green-50"
            }`}
            hapticFeedback="heavy"
          >
            <div className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-200' : 'bg-muted-foreground/50'}`} />
            {isOnline ? 'EN LIGNE - Recevoir des courses' : 'HORS LIGNE - Aucune nouvelle course'}
          </TouchOptimizedButton>
        </div>

        {/* Main content based on current state */}
        {currentView === 'request' && renderRideRequest()}
        {currentView === 'ride' && renderActiveRide()}
        {currentView === 'dashboard' && (
          <>
            {renderCompactStats()}
            {renderQuickActions()}
          </>
        )}
      </div>
    </MobileOptimizer>
  );
};

export default MobileDriverInterface;