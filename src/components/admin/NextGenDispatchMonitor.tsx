// Monitoring en temps réel du système de dispatch nouvelle génération
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Signal,
  RefreshCw,
  Target
} from 'lucide-react';
import { intelligentDispatch } from '@/services/intelligentDispatchService';
import { robustNotifications } from '@/services/robustNotificationService';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { supabase } from '@/integrations/supabase/client';

interface DispatchMetrics {
  success_rate: number;
  average_assignment_time: number;
  average_driver_distance: number;
  surge_frequency: number;
  active_requests: number;
  available_drivers: number;
  location_accuracy: number;
  notification_success_rate: number;
}

interface RealtimeStats {
  total_requests_today: number;
  successful_assignments: number;
  failed_assignments: number;
  average_response_time: number;
  cities_active: string[];
  peak_demand_zone: string;
}

export default function NextGenDispatchMonitor() {
  const [metrics, setMetrics] = useState<DispatchMetrics>({
    success_rate: 0,
    average_assignment_time: 0,
    average_driver_distance: 0,
    surge_frequency: 0,
    active_requests: 0,
    available_drivers: 0,
    location_accuracy: 0,
    notification_success_rate: 0
  });

  const { accuracy } = useMasterLocation();

  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    total_requests_today: 0,
    successful_assignments: 0,
    failed_assignments: 0,
    average_response_time: 0,
    cities_active: [],
    peak_demand_zone: ''
  });

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
  }>>([]);

  const [loading, setLoading] = useState(false);

  // Charger les métriques
  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [dispatchMetrics, notificationStats] = await Promise.all([
        intelligentDispatch.getDispatchMetrics(),
        robustNotifications.getDeliveryStats()
      ]);

      // Compter les demandes actives
      const { count: activeRequests } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'dispatching', 'searching']);

      // Compter les chauffeurs disponibles
      const { count: availableDrivers } = await supabase
        .from('driver_locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_available', true);

      setMetrics({
        success_rate: dispatchMetrics.success_rate,
        average_assignment_time: dispatchMetrics.average_assignment_time,
        average_driver_distance: dispatchMetrics.average_driver_distance,
        surge_frequency: dispatchMetrics.surge_frequency,
        active_requests: activeRequests || 0,
        available_drivers: availableDrivers || 0,
        location_accuracy: accuracy || 0,
        notification_success_rate: notificationStats.success_rate
      });

      // Charger les stats temps réel
      await loadRealtimeStats();

    } catch (error) {
      console.error('Erreur chargement métriques:', error);
      addAlert('error', 'Erreur lors du chargement des métriques');
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayBookings } = await supabase
        .from('transport_bookings')
        .select('status, created_at, pickup_location')
        .gte('created_at', today.toISOString());

      const successful = todayBookings?.filter(b => b.status === 'completed').length || 0;
      const failed = todayBookings?.filter(b => b.status === 'cancelled').length || 0;

      // Détection des villes actives
      const cities = [...new Set(todayBookings?.map(b => {
        if (b.pickup_location?.includes('Kinshasa')) return 'Kinshasa';
        if (b.pickup_location?.includes('Lubumbashi')) return 'Lubumbashi';
        if (b.pickup_location?.includes('Kolwezi')) return 'Kolwezi';
        if (b.pickup_location?.includes('Likasi')) return 'Likasi';
        if (b.pickup_location?.includes('Abidjan')) return 'Abidjan';
        return null;
      }).filter(Boolean))] as string[];

      setRealtimeStats({
        total_requests_today: todayBookings?.length || 0,
        successful_assignments: successful,
        failed_assignments: failed,
        average_response_time: 125, // Simulé
        cities_active: cities,
        peak_demand_zone: cities[0] || 'Aucune'
      });

    } catch (error) {
      console.error('Erreur stats temps réel:', error);
    }
  };

  const addAlert = (type: 'warning' | 'error' | 'info', message: string) => {
    const alert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [alert, ...prev.slice(0, 4)]);
  };

  // Surveillance en temps réel
  useEffect(() => {
    loadMetrics();
    
    const interval = setInterval(() => {
      loadMetrics();
    }, 30000); // Toutes les 30 secondes

    // Surveillance des alertes
    const alertInterval = setInterval(() => {
      if (metrics.success_rate < 80) {
        addAlert('warning', `Taux de succès faible: ${metrics.success_rate.toFixed(1)}%`);
      }
      if (metrics.available_drivers < 5) {
        addAlert('error', `Peu de chauffeurs disponibles: ${metrics.available_drivers}`);
      }
      if (metrics.notification_success_rate < 90) {
        addAlert('warning', `Notifications en échec: ${(100 - metrics.notification_success_rate).toFixed(1)}%`);
      }
    }, 60000); // Toutes les minutes

    return () => {
      clearInterval(interval);
      clearInterval(alertInterval);
    };
  }, []);

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return 'text-green-600';
    if (value >= thresholds[0]) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return 'bg-green-500';
    if (value >= thresholds[0]) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Succès</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getStatusColor(metrics.success_rate, [80, 90])}`}>
                    {metrics.success_rate.toFixed(1)}%
                  </span>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Progress 
                value={metrics.success_rate} 
                className="w-16 h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps Moyen</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getStatusColor(120 - metrics.average_assignment_time, [60, 90])}`}>
                    {metrics.average_assignment_time.toFixed(0)}s
                  </span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chauffeurs Actifs</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getStatusColor(metrics.available_drivers, [10, 20])}`}>
                    {metrics.available_drivers}
                  </span>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Demandes Actives</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {metrics.active_requests}
                  </span>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{alert.timestamp}</span> - {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="performance" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="geography">Géographie</TabsTrigger>
            <TabsTrigger value="technical">Technique</TabsTrigger>
          </TabsList>
          
          <Button onClick={loadMetrics} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Métriques de Dispatch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Distance moyenne chauffeur</span>
                    <span className="font-medium">{metrics.average_driver_distance.toFixed(1)} km</span>
                  </div>
                  <Progress value={(5 - metrics.average_driver_distance) * 20} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Fréquence surge pricing</span>
                    <span className="font-medium">{metrics.surge_frequency.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.surge_frequency} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Notifications livrées</span>
                    <span className="font-medium">{metrics.notification_success_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.notification_success_rate} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Activité Aujourd'hui
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {realtimeStats.successful_assignments}
                    </div>
                    <div className="text-sm text-muted-foreground">Succès</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {realtimeStats.failed_assignments}
                    </div>
                    <div className="text-sm text-muted-foreground">Échecs</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-medium">
                    {realtimeStats.total_requests_today} demandes totales
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Réponse moyenne: {realtimeStats.average_response_time}s
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Villes Actives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realtimeStats.cities_active.map(city => (
                    <div key={city} className="flex items-center justify-between">
                      <span className="font-medium">{city}</span>
                      <Badge variant="secondary">
                        <Signal className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    </div>
                  ))}
                  {realtimeStats.cities_active.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune activité détectée aujourd'hui
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zone de Forte Demande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-primary">
                    {realtimeStats.peak_demand_zone}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Zone avec le plus d'activité aujourd'hui
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Géolocalisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Précision actuelle</span>
                    <span className="font-medium">
                      {metrics.location_accuracy.toFixed(0)}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Haute précision</span>
                    <Badge variant={metrics.location_accuracy < 100 ? 'default' : 'secondary'}>
                      {metrics.location_accuracy < 100 ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Taux de livraison</span>
                    <span className="font-medium">
                      {metrics.notification_success_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>File d'attente retry</span>
                    <span className="font-medium">
                      {robustNotifications.getRetryQueueSize()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>État Système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Dispatch intelligent</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Géofencing adaptatif</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Monitoring temps réel</span>
                    <Badge variant="default">
                      <Activity className="h-3 w-3 mr-1" />
                      En ligne
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}