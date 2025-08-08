
import React from 'react';
import { Users, Car, DollarSign, Wallet, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

interface PartnerKPIGridProps {
  stats: any;
}

export const PartnerKPIGrid: React.FC<PartnerKPIGridProps> = ({ stats }) => {
  const isMobile = useIsMobile();

  const kpiItems = [
    {
      icon: Users,
      label: "Chauffeurs actifs",
      value: stats.activeDrivers || 0,
      suffix: "",
      color: "bg-accent",
      badge: { text: "En temps réel", icon: Activity, class: "bg-secondary-light text-secondary" }
    },
    {
      icon: Car,
      label: "Courses en cours",
      value: stats.ongoingRides || 0,
      suffix: "",
      color: "bg-primary",
      badge: { text: "+12%", icon: TrendingUp, class: "bg-green-50 text-green-600" }
    },
    {
      icon: DollarSign,
      label: "Revenus aujourd'hui",
      value: Math.round(stats.todayRevenue || 0).toLocaleString(),
      suffix: " CDF",
      color: "bg-secondary",
      badge: { text: "+8% vs hier", icon: TrendingUp, class: "bg-green-50 text-green-600" }
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
                {`${stats.availableVehicles || 0} / ${stats.totalFleet || 0}`}
              </p>
            </div>
            <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
              <p className="text-body-sm text-muted-foreground">Taux d'utilisation</p>
              <p className="text-heading-md font-bold text-primary">
                {stats.totalFleet > 0 ? Math.round(((stats.totalFleet - stats.availableVehicles) / stats.totalFleet) * 100) : 0}%
              </p>
            </div>
          </div>
          
          <Progress 
            value={stats.totalFleet > 0 ? ((stats.totalFleet - stats.availableVehicles) / stats.totalFleet) * 100 : 0} 
            className="h-2"
          />
        </CardContent>
      </Card>
    </div>
  );
};
