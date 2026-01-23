import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Car, Navigation, Activity, Route, Star, AlertTriangle } from 'lucide-react';

interface StatusProgressProps {
  status: string;
  statusConfig: {
    label: string;
    color: string;
    icon: React.ComponentType<any>;
    description: string;
    progress: number;
  };
  bookingId: string;
}

const StatusProgress: React.FC<StatusProgressProps> = ({ status, statusConfig, bookingId }) => {
  const StatusIcon = statusConfig.icon;

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-red-500';
    if (progress < 30) return 'bg-amber-500';
    if (progress < 70) return 'bg-blue-500';
    if (progress < 100) return 'bg-purple-500';
    return 'bg-green-500';
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="glassmorphism mb-6">
      <CardContent className="p-6">
        {/* Statut principal */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${statusConfig.color}`}>
              <StatusIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{statusConfig.label}</h2>
              <p className="text-muted-foreground">{statusConfig.description}</p>
            </div>
          </div>
          <Badge variant="secondary">
            #{bookingId.slice(-6)}
          </Badge>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression</span>
            <span>{statusConfig.progress}%</span>
          </div>
          <Progress 
            value={statusConfig.progress} 
            className="h-2"
          />
        </div>

        {/* Timeline des statuts */}
        <div className="mt-6 space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">Étapes de votre course</h3>
          
          <div className="space-y-2">
            {/* Recherche */}
            <div className={`flex items-center gap-3 ${
              ['pending', 'driver_assigned', 'driver_en_route', 'pickup', 'in_progress', 'completed'].includes(status) 
                ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                ['pending', 'driver_assigned', 'driver_en_route', 'pickup', 'in_progress', 'completed'].includes(status)
                  ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">Recherche d'un chauffeur</span>
            </div>

            {/* Chauffeur assigné */}
            <div className={`flex items-center gap-3 ${
              ['driver_assigned', 'driver_en_route', 'pickup', 'in_progress', 'completed'].includes(status) 
                ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                ['driver_assigned', 'driver_en_route', 'pickup', 'in_progress', 'completed'].includes(status)
                  ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">Chauffeur assigné</span>
            </div>

            {/* En route vers vous */}
            <div className={`flex items-center gap-3 ${
              ['driver_en_route', 'pickup', 'in_progress', 'completed'].includes(status) 
                ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                ['driver_en_route', 'pickup', 'in_progress', 'completed'].includes(status)
                  ? 'bg-green-500' : status === 'driver_en_route' ? 'bg-blue-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">Chauffeur en route</span>
            </div>

            {/* Prise en charge */}
            <div className={`flex items-center gap-3 ${
              ['pickup', 'in_progress', 'completed'].includes(status) 
                ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                ['pickup', 'in_progress', 'completed'].includes(status)
                  ? 'bg-green-500' : status === 'pickup' ? 'bg-purple-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">Prise en charge</span>
            </div>

            {/* En cours */}
            <div className={`flex items-center gap-3 ${
              ['in_progress', 'completed'].includes(status) 
                ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                ['in_progress', 'completed'].includes(status)
                  ? 'bg-green-500' : status === 'in_progress' ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
              <span className="text-sm">En route vers destination</span>
            </div>

            {/* Terminée */}
            <div className={`flex items-center gap-3 ${
              status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">Course terminée</span>
            </div>
          </div>
        </div>

        {/* Indicateur temps réel */}
        {['driver_en_route', 'pickup', 'in_progress'].includes(status) && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Suivi en temps réel actif</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusProgress;