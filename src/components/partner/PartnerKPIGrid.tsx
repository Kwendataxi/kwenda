
import React from 'react';
import { Users, Car, DollarSign, Wallet, Activity, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

interface PartnerKPIGridProps {
  stats: any;
}

export const PartnerKPIGrid: React.FC<PartnerKPIGridProps> = ({ stats }) => {
  const isMobile = useIsMobile();

  // 🛡️ Protection contre stats null/undefined
  if (!stats) {
    return (
      <div className="p-4">
        <Card className="card-floating border-0 p-6 animate-pulse">
          <CardContent className="text-center">
            <p className="text-muted-foreground">Chargement des statistiques...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiItems = [
    {
      icon: Users,
      label: "Chauffeurs actifs",
      value: stats?.activeDrivers || 0,
      suffix: "",
      color: "bg-accent",
      badge: { text: (stats?.activeDrivers || 0) > 0 ? "Actifs" : "Aucun", icon: Activity, class: (stats?.activeDrivers || 0) > 0 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600" }
    },
    {
      icon: Car,
      label: "Courses en cours",
      value: stats?.ongoingRides || 0,
      suffix: "",
      color: "bg-primary",
      badge: { text: (stats?.ongoingRides || 0) > 0 ? "En cours" : "Aucune", icon: (stats?.ongoingRides || 0) > 0 ? TrendingUp : Clock, class: (stats?.ongoingRides || 0) > 0 ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-600" }
    },
    {
      icon: DollarSign,
      label: "Commissions gagnées",
      value: Math.round(stats?.totalCommissions || 0).toLocaleString(),
      suffix: " CDF",
      color: "bg-secondary",
      badge: { text: (stats?.totalCommissions || 0) > 0 ? "Gains réels" : "Aucun", icon: DollarSign, class: (stats?.totalCommissions || 0) > 0 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600" }
    },
    {
      icon: Wallet,
      label: "Montant rechargé",
      value: Math.round(stats?.totalTopups || 0).toLocaleString(),
      suffix: " CDF",
      color: "bg-orange-500",
      badge: { text: (stats?.totalTopups || 0) > 0 ? "Investissement" : "Aucun", icon: Wallet, class: (stats?.totalTopups || 0) > 0 ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600" }
    },
  ];

  return (
    <div className="p-4">
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {kpiItems.map((item, index) => (
          <Card key={index} className="card-floating border-0 p-3 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className={`font-semibold text-card-foreground ${isMobile ? 'text-sm' : 'text-body-md'}`}>
                  {item.label}
                </span>
              </div>
              
              <p className={`text-foreground font-bold mb-2 ${isMobile ? 'text-lg' : 'text-display-sm'}`}>
                {item.value}{item.suffix}
              </p>
              
              <p className={`font-medium px-2 py-1 rounded-md inline-flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-caption'} ${item.badge.class}`}>
                {item.badge.icon && <item.badge.icon className="w-3 h-3" />}
                {item.badge.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fleet Status Card */}
      <Card className="card-floating border-0 mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car className="h-5 w-5" />
            <span className="font-semibold">État de la flotte</span>
          </div>
          
          <div className={`flex items-center justify-between mb-4 ${isMobile ? 'flex-col gap-2' : ''}`}>
            <div className={isMobile ? 'text-center' : ''}>
              <p className="text-body-sm text-muted-foreground">Véhicules disponibles</p>
              <p className="text-heading-md font-bold text-card-foreground">
                {`${stats?.availableVehicles || 0} / ${stats?.totalFleet || 0}`}
              </p>
            </div>
            <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
              <p className="text-body-sm text-muted-foreground">Taux d'utilisation</p>
              <p className="text-heading-md font-bold text-primary">
                {(stats?.totalFleet || 0) > 0 ? Math.round((((stats?.totalFleet || 0) - (stats?.availableVehicles || 0)) / (stats?.totalFleet || 0)) * 100) : 0}%
              </p>
            </div>
          </div>
          
          <Progress 
            value={(stats?.totalFleet || 0) > 0 ? (((stats?.totalFleet || 0) - (stats?.availableVehicles || 0)) / (stats?.totalFleet || 0)) * 100 : 0} 
            className="h-2"
          />
        </CardContent>
      </Card>
    </div>
  );
};
