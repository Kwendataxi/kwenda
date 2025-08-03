import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  MapPin,
  Clock,
  Star
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface KPIData {
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface MobileKPIGridProps {
  realTimeStats: any;
}

export const MobileKPIGrid: React.FC<MobileKPIGridProps> = ({ realTimeStats }) => {
  const isMobile = useIsMobile();

  const kpiData: KPIData[] = [
    {
      title: 'Utilisateurs Total',
      value: realTimeStats.totalUsers.toLocaleString(),
      trend: '+12%',
      trendDirection: 'up',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Chauffeurs Actifs',
      value: realTimeStats.activeDrivers.toLocaleString(),
      trend: '+8%',
      trendDirection: 'up',
      icon: <Car className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      title: 'Revenus Aujourd\'hui',
      value: `${realTimeStats.todayRevenue.toLocaleString()} CDF`,
      trend: '+15%',
      trendDirection: 'up',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-yellow-500'
    },
    {
      title: 'Courses Actives',
      value: realTimeStats.activeRides.toLocaleString(),
      trend: '+5%',
      trendDirection: 'up',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Commandes Marketplace',
      value: realTimeStats.marketplaceOrders.toLocaleString(),
      trend: '+20%',
      trendDirection: 'up',
      icon: <ShoppingBag className="h-5 w-5" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Zones Couvertes',
      value: '24',
      trend: '0%',
      trendDirection: 'neutral',
      icon: <MapPin className="h-5 w-5" />,
      color: 'bg-cyan-500'
    },
    {
      title: 'Temps d\'Attente Moyen',
      value: '4.2 min',
      trend: '-10%',
      trendDirection: 'up',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-indigo-500'
    },
    {
      title: 'Note Moyenne',
      value: '4.8/5',
      trend: '+2%',
      trendDirection: 'up',
      icon: <Star className="h-5 w-5" />,
      color: 'bg-pink-500'
    }
  ];

  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-3 md:gap-4 p-4`}>
      {kpiData.map((kpi, index) => (
        <Card 
          key={index} 
          className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur"
        >
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${kpi.color} text-white`}>
                {kpi.icon}
              </div>
              <Badge 
                variant={kpi.trendDirection === 'up' ? 'default' : 'secondary'}
                className="text-xs px-1.5 py-0.5"
              >
                {kpi.trend}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-muted-foreground font-medium line-clamp-2">
                {kpi.title}
              </p>
              <p className="text-lg md:text-xl font-bold text-foreground">
                {kpi.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};