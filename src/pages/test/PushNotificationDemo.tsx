/**
 * Démo des notifications push pour tester le système
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Smartphone, Send, Settings } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationDemo: React.FC = () => {
  const {
    isInitialized,
    hasPermission,
    isSupported,
    loading,
    error,
    canSendNotifications,
    needsPermission,
    initialize,
    sendTestNotification,
    disableNotifications,
    getStatus
  } = usePushNotifications();

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      console.log('✅ Test notification envoyé');
    }
  };

  const handleDisableNotifications = async () => {
    const success = await disableNotifications();
    if (success) {
      console.log('🔕 Notifications désactivées');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Démo Notifications Push</h1>
        <p className="text-muted-foreground">
          Testez le système de notifications push Capacitor + Edge Functions
        </p>
      </div>

      {/* Statut du système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Statut du système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Support</p>
              <Badge variant={isSupported ? "default" : "destructive"}>
                {isSupported ? "✅ Supporté" : "❌ Non supporté"}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Initialisé</p>
              <Badge variant={isInitialized ? "default" : "secondary"}>
                {isInitialized ? "✅ Initialisé" : "⏳ En attente"}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Permissions</p>
              <Badge variant={hasPermission ? "default" : needsPermission ? "destructive" : "secondary"}>
                {hasPermission ? "✅ Accordées" : needsPermission ? "❌ Refusées" : "⏳ En attente"}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Prêt</p>
              <Badge variant={canSendNotifications ? "default" : "secondary"}>
                {canSendNotifications ? "✅ Prêt" : "⏳ Configuration"}
              </Badge>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">❌ Erreur: {error}</p>
            </div>
          )}

          {loading && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-primary">⏳ Chargement en cours...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={initialize}
          disabled={loading || isInitialized}
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          {isInitialized ? 'Déjà initialisé' : 'Initialiser'}
        </Button>

        <Button
          onClick={handleTestNotification}
          disabled={!canSendNotifications || loading}
          variant="outline"
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          Test notification
        </Button>

        <Button
          onClick={handleDisableNotifications}
          disabled={!isInitialized || loading}
          variant="secondary"
          className="w-full"
        >
          <Bell className="w-4 h-4 mr-2" />
          Désactiver
        </Button>

        <Button
          onClick={() => getStatus().then(console.log)}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          📊 Voir statut
        </Button>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Instructions de test</CardTitle>
          <CardDescription>
            Comment tester les notifications push dans différents environnements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">1. Navigateur Web (PWA)</h4>
              <p className="text-sm text-muted-foreground">
                • Cliquez sur "Initialiser" pour demander les permissions<br/>
                • Autorisez les notifications dans la popup du navigateur<br/>
                • Testez avec "Test notification"
              </p>
            </div>

            <div>
              <h4 className="font-medium">2. Mobile (Capacitor)</h4>
              <p className="text-sm text-muted-foreground">
                • Exportez vers GitHub et compilez l'app native<br/>
                • Les permissions seront demandées automatiquement<br/>
                • Les notifications apparaîtront nativement
              </p>
            </div>

            <div>
              <h4 className="font-medium">3. Admin (Monitoring)</h4>
              <p className="text-sm text-muted-foreground">
                • Accédez à l'interface admin pour monitoring<br/>
                • Consultez les logs et statistiques<br/>
                • Gérez la queue de notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités implémentées */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Fonctionnalités implémentées - Phase 2</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">🔧 Backend (Edge Functions)</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• notification-dispatcher : Queue + retry automatique</li>
                <li>• Système de priorités (low, normal, high, urgent)</li>
                <li>• Gestion recipients : all_drivers, all_clients, IDs custom</li>
                <li>• API endpoints : /send, /status, /process-queue, /retry-failed</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2">📱 Frontend (Services)</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• pushNotificationService : Gestion Capacitor + Web</li>
                <li>• usePushNotifications : Hook React complet</li>
                <li>• Auto-detection : Native vs PWA</li>
                <li>• Gestion permissions et tokens</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2">🗄️ Base de données</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• push_notification_queue : File d'attente avec retry</li>
                <li>• push_notification_tokens : Tokens par plateforme</li>
                <li>• push_notification_analytics : Logs et métriques</li>
                <li>• RLS activé + Policies sécurisées</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-2">🎛️ Interface Admin</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• NotificationMonitoringDashboard : Interface complète</li>
                <li>• Statistiques temps réel</li>
                <li>• Gestion queue et retry</li>
                <li>• Envoi notifications personnalisées</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationDemo;