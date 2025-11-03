import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverRideNotifications from './DriverRideNotifications';
import DemandHeatmapView from './DemandHeatmapView';
import { DriverHeartbeatMonitor } from './DriverHeartbeatMonitor';
import { DriverSubscriptionCard } from './DriverSubscriptionCard';
import { DriverArrivalButton } from './DriverArrivalButton';
import { Car, MapPin, Clock, Star, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wddlktajnhwhyquwcdgf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export function DriverDashboard() {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Fetch active booking
  useEffect(() => {
    if (!user?.id) return;

    const fetchActiveBooking = async () => {
      try {
        const { data } = await supabase
          .from('transport_bookings')
          .select('id, pickup_location, destination, estimated_price, status, driver_id')
          .eq('driver_id', user.id)
          .eq('status', 'driver_assigned')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setActiveBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
      }
    };

    fetchActiveBooking();
    const interval = setInterval(fetchActiveBooking, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Fetch subscription
  useEffect(() => {
    if (!user?.id) return;

    const fetchSubscription = async () => {
      try {
        const { data } = await supabase
          .from('driver_subscriptions')
          .select('id, driver_id, rides_remaining, rides_used, is_active')
          .eq('driver_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [user?.id]);

  const handleArrivalConfirmed = async (ridesRemaining: number) => {
    console.log('✅ Arrivée confirmée, crédits restants:', ridesRemaining);
    
    // Refresh subscription
    if (user?.id) {
      try {
        const { data } = await supabase
          .from('driver_subscriptions')
          .select('id, driver_id, rides_remaining, rides_used, is_active')
          .eq('driver_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        setSubscription(data);
      } catch (error) {
        console.error('Error refreshing subscription:', error);
      }
    }
    setActiveBooking(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header avec badge crédits */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-3xl font-bold text-primary">Tableau de Bord Chauffeur</h1>
            {subscription && (
              <Badge 
                variant="outline" 
                className={`flex items-center gap-2 text-base px-4 py-2 ${
                  subscription.rides_remaining < 3 ? 'border-red-500 text-red-500' :
                  subscription.rides_remaining < 10 ? 'border-orange-500 text-orange-500' :
                  'border-green-500 text-green-500'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span className="font-bold">{subscription.rides_remaining}</span>
                <span className="text-muted-foreground">courses</span>
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Gérez vos courses et restez disponible</p>
        </div>

        {/* Heartbeat Monitor - CRITIQUE pour la détection de disponibilité */}
        <DriverHeartbeatMonitor />

        {/* Subscription Card - Shows credits and status */}
        <DriverSubscriptionCard />

        {/* Course active - Bouton d'arrivée */}
        {activeBooking && (
          <Card className="border-primary border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-primary" />
                Course en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Départ</p>
                    <p className="font-medium">{activeBooking.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-medium">{activeBooking.destination}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Prix estimé</p>
                  <p className="text-lg font-bold text-primary">{activeBooking.estimated_price} CDF</p>
                </div>
              </div>
              <DriverArrivalButton
                bookingId={activeBooking.id}
                ridesRemaining={subscription?.rides_remaining || 0}
                onArrivalConfirmed={handleArrivalConfirmed}
                className="w-full"
              />
            </CardContent>
          </Card>
        )}

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Statut du Chauffeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-500">
                  En ligne
                </Badge>
                <Badge variant="secondary">
                  Disponible
                </Badge>
              </div>
              <Button variant="outline" size="sm">
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Courses vs Zones Rentables */}
        <Tabs defaultValue="rides" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rides">
              <Car className="h-4 w-4 mr-2" />
              Mes Courses
            </TabsTrigger>
            <TabsTrigger value="heatmap">
              <TrendingUp className="h-4 w-4 mr-2" />
              Zones Rentables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rides" className="space-y-4">
            {/* Ride Notifications */}
            <DriverRideNotifications />
          </TabsContent>

          <TabsContent value="heatmap">
            {/* Demand Heatmap */}
            <DemandHeatmapView />
          </TabsContent>
        </Tabs>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Courses aujourd'hui</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Temps en ligne</p>
                  <p className="text-2xl font-bold">8h 30m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <p className="text-2xl font-bold">4.8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
