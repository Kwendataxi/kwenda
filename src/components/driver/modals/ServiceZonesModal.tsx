import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_ZONES = [
  { id: '1', name: 'Gombe', active: true, rides: 45, color: 'bg-green-500' },
  { id: '2', name: 'Kinshasa', active: true, rides: 32, color: 'bg-blue-500' },
  { id: '3', name: 'Limete', active: false, rides: 0, color: 'bg-gray-300' },
  { id: '4', name: 'Ngaliema', active: true, rides: 28, color: 'bg-purple-500' },
  { id: '5', name: 'Lemba', active: false, rides: 0, color: 'bg-gray-300' },
  { id: '6', name: 'Matete', active: true, rides: 19, color: 'bg-orange-500' },
];

export const ServiceZonesModal: React.FC = () => {
  const activeZones = AVAILABLE_ZONES.filter(z => z.active);

  const toggleZone = (zoneId: string) => {
    toast.success('Zone mise à jour !');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">Mes zones de service</span>
          </div>
          <p className="text-sm opacity-90">
            {activeZones.length} zone{activeZones.length > 1 ? 's' : ''} active{activeZones.length > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Liste des zones */}
      <div className="space-y-3">
        {AVAILABLE_ZONES.map((zone) => (
          <Card key={zone.id} className={zone.active ? 'border-green-200 bg-green-50/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${zone.color}`} />
                  <div>
                    <h4 className="font-medium">{zone.name}</h4>
                    {zone.active && (
                      <p className="text-xs text-muted-foreground">
                        {zone.rides} courses ce mois-ci
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {zone.active && (
                    <Badge className="bg-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  <Button
                    variant={zone.active ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleZone(zone.id)}
                  >
                    {zone.active ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bouton ajouter zone */}
      <Button variant="outline" className="w-full" onClick={() => toast.info('Fonctionnalité bientôt disponible')}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une zone
      </Button>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 Activez les zones où vous souhaitez recevoir des courses. Plus vous couvrez de zones, plus vous aurez d'opportunités !
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
