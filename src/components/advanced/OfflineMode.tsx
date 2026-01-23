import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  Database, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  rides: any[];
  payments: any[];
  locations: any[];
  messages: any[];
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSync: number;
  downloadProgress: number;
  isDownloading: boolean;
  isSyncing: boolean;
}

const OfflineMode: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    pendingSync: 0,
    downloadProgress: 0,
    isDownloading: false,
    isSyncing: false
  });

  const [offlineData, setOfflineData] = useState<OfflineData>({
    rides: [],
    payments: [],
    locations: [],
    messages: []
  });

  const [cachedSize, setCachedSize] = useState(12.5); // MB

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (syncStatus.pendingSync > 0) {
        toast({
          title: 'Connexion rétablie',
          description: 'Synchronisation automatique en cours...',
        });
        syncData();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      toast({
        title: 'Mode hors ligne activé',
        description: 'Vos données seront sauvegardées localement',
        variant: 'destructive'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate pending sync items when offline
    if (!syncStatus.isOnline) {
      const interval = setInterval(() => {
        setSyncStatus(prev => ({
          ...prev,
          pendingSync: prev.pendingSync + Math.floor(Math.random() * 3)
        }));
      }, 30000);

      return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus.isOnline, syncStatus.pendingSync]);

  const downloadForOffline = async () => {
    setSyncStatus(prev => ({ ...prev, isDownloading: true, downloadProgress: 0 }));

    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setSyncStatus(prev => ({ ...prev, downloadProgress: i }));
    }

    // Mock downloaded data
    setOfflineData({
      rides: [
        { id: 1, from: 'Gombe', to: 'Kinshasa', time: '14:30', cached: true },
        { id: 2, from: 'Lemba', to: 'Ngaliema', time: '15:45', cached: true }
      ],
      payments: [
        { id: 1, amount: 3500, method: 'Airtel Money', cached: true },
        { id: 2, amount: 2800, method: 'M-Pesa', cached: true }
      ],
      locations: [
        { name: 'Gombe Centre', lat: -4.3025, lng: 15.3074, cached: true },
        { name: 'Aéroport N\'Djili', lat: -4.3857, lng: 15.4446, cached: true }
      ],
      messages: [
        { id: 1, text: 'Votre chauffeur est en route', cached: true }
      ]
    });

    setCachedSize(25.8);
    setSyncStatus(prev => ({ 
      ...prev, 
      isDownloading: false, 
      downloadProgress: 100,
      lastSync: new Date()
    }));

    toast({
      title: 'Téléchargement terminé',
      description: 'Données disponibles hors ligne',
    });
  };

  const syncData = async () => {
    if (!syncStatus.isOnline) {
      toast({
        title: 'Pas de connexion',
        description: 'Impossible de synchroniser sans connexion internet',
        variant: 'destructive'
      });
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 3000));

    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      pendingSync: 0,
      lastSync: new Date()
    }));

    toast({
      title: 'Synchronisation réussie',
      description: 'Toutes vos données ont été sauvegardées',
    });
  };

  const clearCache = () => {
    setOfflineData({
      rides: [],
      payments: [],
      locations: [],
      messages: []
    });
    setCachedSize(0);
    
    toast({
      title: 'Cache vidé',
      description: 'Toutes les données hors ligne ont été supprimées',
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Jamais';
    return new Intl.DateTimeFormat('fr-CD', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span>État de la connexion</span>
            <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
              {syncStatus.isOnline ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(syncStatus.lastSync)}</p>
              <p className="text-sm text-muted-foreground">Dernière sync</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{syncStatus.pendingSync}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{cachedSize.toFixed(1)} MB</p>
              <p className="text-sm text-muted-foreground">Données en cache</p>
            </div>
          </div>

          {syncStatus.pendingSync > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                {syncStatus.pendingSync} éléments en attente de synchronisation
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Progress */}
      {syncStatus.isDownloading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Téléchargement en cours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{syncStatus.downloadProgress}%</span>
              </div>
              <Progress value={syncStatus.downloadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Téléchargement des données pour utilisation hors ligne...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={downloadForOffline}
          disabled={syncStatus.isDownloading}
          variant="outline"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger pour hors ligne
        </Button>

        <Button 
          onClick={syncData}
          disabled={!syncStatus.isOnline || syncStatus.isSyncing}
          className="w-full"
        >
          {syncStatus.isSyncing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {syncStatus.isSyncing ? 'Synchronisation...' : 'Synchroniser'}
        </Button>

        <Button 
          onClick={clearCache}
          variant="destructive"
          className="w-full"
        >
          <Database className="h-4 w-4 mr-2" />
          Vider le cache
        </Button>
      </div>

      {/* Offline Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(offlineData).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 capitalize">
                <Database className="h-4 w-4" />
                <span>{category}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée en cache</p>
              ) : (
                <div className="space-y-2">
                  {items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{item.from || item.text || item.name || `${category} ${index + 1}`}</span>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">Mis en cache</span>
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{items.length - 3} autres éléments
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OfflineMode;