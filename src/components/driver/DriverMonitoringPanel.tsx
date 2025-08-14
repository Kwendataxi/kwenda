import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Smartphone,
  RefreshCw,
  Bug,
  Wifi,
  WifiOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SystemStatus {
  geolocation: 'working' | 'error' | 'loading';
  database: 'working' | 'error' | 'loading';
  realtime: 'working' | 'error' | 'loading';
  edgeFunctions: 'working' | 'error' | 'loading';
  notifications: 'working' | 'error' | 'loading';
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

export const DriverMonitoringPanel = () => {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    geolocation: 'loading',
    database: 'loading',
    realtime: 'loading',
    edgeFunctions: 'loading',
    notifications: 'loading'
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addLog = (level: LogEntry['level'], message: string, details?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const testGeolocation = async () => {
    setSystemStatus(prev => ({ ...prev, geolocation: 'loading' }));
    addLog('info', 'Test de géolocalisation...');
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Géolocalisation non supportée');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      setSystemStatus(prev => ({ ...prev, geolocation: 'working' }));
      addLog('info', `GPS OK: ${position.coords.latitude}, ${position.coords.longitude}`, {
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
    } catch (error: any) {
      setSystemStatus(prev => ({ ...prev, geolocation: 'error' }));
      addLog('error', `Erreur GPS: ${error.message}`, error);
    }
  };

  const testDatabase = async () => {
    setSystemStatus(prev => ({ ...prev, database: 'loading' }));
    addLog('info', 'Test de connexion base de données...');
    
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('driver_id')
        .eq('driver_id', user?.id)
        .limit(1);

      if (error) throw error;

      setSystemStatus(prev => ({ ...prev, database: 'working' }));
      addLog('info', 'Base de données OK', { recordCount: data?.length });
    } catch (error: any) {
      setSystemStatus(prev => ({ ...prev, database: 'error' }));
      addLog('error', `Erreur DB: ${error.message}`, error);
    }
  };

  const testRealtime = async () => {
    setSystemStatus(prev => ({ ...prev, realtime: 'loading' }));
    addLog('info', 'Test des notifications temps réel...');
    
    try {
      const channel = supabase.channel('test-channel');
      
      const subscription = channel
        .on('broadcast', { event: 'test' }, (payload) => {
          setSystemStatus(prev => ({ ...prev, realtime: 'working' }));
          addLog('info', 'Real-time OK', payload);
          channel.unsubscribe();
        })
        .subscribe();

      // Send test message
      setTimeout(() => {
        channel.send({
          type: 'broadcast',
          event: 'test',
          payload: { message: 'test-message', timestamp: Date.now() }
        });
      }, 1000);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (systemStatus.realtime === 'loading') {
          setSystemStatus(prev => ({ ...prev, realtime: 'error' }));
          addLog('error', 'Timeout real-time');
          channel.unsubscribe();
        }
      }, 5000);

    } catch (error: any) {
      setSystemStatus(prev => ({ ...prev, realtime: 'error' }));
      addLog('error', `Erreur Real-time: ${error.message}`, error);
    }
  };

  const testEdgeFunctions = async () => {
    setSystemStatus(prev => ({ ...prev, edgeFunctions: 'loading' }));
    addLog('info', 'Test des edge functions...');
    
    try {
      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          action: 'find_drivers',
          order_id: 'test-order-id',
          pickup_coordinates: { lat: -4.3217, lng: 15.3069 },
          mode: 'flex',
          radius: 5
        }
      });

      if (error) throw error;

      setSystemStatus(prev => ({ ...prev, edgeFunctions: 'working' }));
      addLog('info', 'Edge Functions OK', data);
    } catch (error: any) {
      setSystemStatus(prev => ({ ...prev, edgeFunctions: 'error' }));
      addLog('error', `Erreur Edge Functions: ${error.message}`, error);
    }
  };

  const testNotifications = async () => {
    setSystemStatus(prev => ({ ...prev, notifications: 'loading' }));
    addLog('info', 'Test des notifications...');
    
    try {
      const { data, error } = await supabase
        .from('push_notifications')
        .insert({
          user_id: user?.id,
          title: 'Test notification',
          message: 'Test du système de notifications',
          notification_type: 'system_test'
        })
        .select()
        .single();

      if (error) throw error;

      setSystemStatus(prev => ({ ...prev, notifications: 'working' }));
      addLog('info', 'Notifications OK', data);
    } catch (error: any) {
      setSystemStatus(prev => ({ ...prev, notifications: 'error' }));
      addLog('error', `Erreur Notifications: ${error.message}`, error);
    }
  };

  const runFullDiagnostic = async () => {
    addLog('info', '=== DIAGNOSTIC COMPLET DÉMARRÉ ===');
    await Promise.all([
      testGeolocation(),
      testDatabase(),
      testRealtime(),
      testEdgeFunctions(),
      testNotifications()
    ]);
    addLog('info', '=== DIAGNOSTIC TERMINÉ ===');
    toast.success('Diagnostic terminé');
  };

  const getStatusIcon = (status: SystemStatus[keyof SystemStatus]) => {
    switch (status) {
      case 'working': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'loading': return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: SystemStatus[keyof SystemStatus]) => {
    switch (status) {
      case 'working': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-yellow-500';
    }
  };

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        runFullDiagnostic();
      }, 30000); // Test toutes les 30 secondes

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoring Système Chauffeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={runFullDiagnostic} className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Diagnostic Complet
            </Button>
            <Button 
              variant={isMonitoring ? "destructive" : "outline"}
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="flex items-center gap-2"
            >
              {isMonitoring ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
              {isMonitoring ? 'Arrêter' : 'Démarrer'} Monitoring
            </Button>
          </div>

          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">Statut Système</TabsTrigger>
              <TabsTrigger value="logs">Logs en Temps Réel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(systemStatus).map(([key, status]) => (
                  <Card key={key} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize">{key}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(status)}
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(status)} text-white border-none`}
                          >
                            {status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Button size="sm" onClick={testGeolocation}>
                  <MapPin className="h-3 w-3 mr-1" />
                  GPS
                </Button>
                <Button size="sm" onClick={testDatabase}>
                  <Activity className="h-3 w-3 mr-1" />
                  DB
                </Button>
                <Button size="sm" onClick={testRealtime}>
                  <Wifi className="h-3 w-3 mr-1" />
                  Real-time
                </Button>
                <Button size="sm" onClick={testEdgeFunctions}>
                  <Smartphone className="h-3 w-3 mr-1" />
                  Edge Func
                </Button>
                <Button size="sm" onClick={testNotifications}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Notifs
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-2">
              <div className="h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun log pour le moment...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="flex gap-2 text-sm">
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.timestamp}
                      </span>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          log.level === 'error' ? 'bg-red-100 text-red-800' :
                          log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.level}
                      </Badge>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLogs([])}
                className="w-full"
              >
                Vider les logs
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};