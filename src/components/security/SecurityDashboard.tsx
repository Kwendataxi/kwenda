import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useSecurityDashboard } from '@/hooks/useSecurityDashboard';

export const SecurityDashboard = () => {
  const { metrics, alerts, status, loading, error, refresh, hasAccess } = useSecurityDashboard();

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tableau de Bord Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Accès refusé</AlertTitle>
            <AlertDescription>
              Vous devez être administrateur pour accéder au tableau de bord sécurité.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des données de sécurité...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={refresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'secured':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'enhanced':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'manual_config':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Sécurité</h1>
          <p className="text-muted-foreground">
            Surveillance et métriques de sécurité en temps réel
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alertes de Sécurité
            </CardTitle>
            <CardDescription>
              Activités suspectes détectées nécessitant votre attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Alert key={index} variant={getAlertSeverityColor(alert.severity) as any}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                    <Badge variant={getAlertSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.metric_name.replace(/_/g, ' ').toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.metric_value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
              <Badge 
                variant={metric.alert_level === 'HIGH' ? 'destructive' : 
                        metric.alert_level === 'MEDIUM' ? 'secondary' : 'outline'}
                className="mt-2"
              >
                {metric.alert_level}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            État de la Sécurité
          </CardTitle>
          <CardDescription>
            Vue d'ensemble des mesures de sécurité en place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <div className="font-medium">{item.check_type}</div>
                    <div className="text-sm text-muted-foreground">{item.details}</div>
                  </div>
                </div>
                <Badge 
                  variant={
                    item.status === 'COMPLETED' || item.status === 'SECURED' || item.status === 'ACTIVE' ? 'default' :
                    item.status === 'ENHANCED' ? 'secondary' :
                    'outline'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Configuration Required */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Configuration Manuelle Requise
          </CardTitle>
          <CardDescription>
            Actions à effectuer dans le tableau de bord Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Protection des Mots de Passe Compromis</AlertTitle>
              <AlertDescription>
                Activez la protection contre les mots de passe compromis dans 
                Supabase Dashboard → Auth → Settings → Password Protection
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Durée d'Expiration OTP</AlertTitle>
              <AlertDescription>
                Réduisez la durée d'expiration OTP à 1 heure dans 
                Supabase Dashboard → Auth → Settings → OTP Expiry
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};