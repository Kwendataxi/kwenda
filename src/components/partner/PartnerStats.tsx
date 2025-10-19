import React from 'react';
import { Car, Users, DollarSign, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const PartnerStats: React.FC = () => {
  const { user } = useAuth();

  // Récupérer les statistiques du partenaire
  const { data: stats, isLoading } = useQuery({
    queryKey: ['partner-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Récupérer l'ID du partenaire
      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return null;

      // Nombre de véhicules
      const { count: vehiclesCount } = await supabase
        .from('rental_vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerData.id)
        .eq('is_active', true);

      // Nombre de chauffeurs actifs
      const { count: driversCount } = await supabase
        .from('partner_drivers')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerData.id)
        .eq('status', 'active');

      // Commissions du mois (utiliser activity_logs ou une autre table appropriée)
      const monthlyCommissions = 0; // À implémenter avec la bonne table

      // Note moyenne (simulée pour l'instant)
      const averageRating = 4.7;

      return {
        totalVehicles: vehiclesCount || 0,
        activeDrivers: driversCount || 0,
        monthlyCommissions,
        averageRating,
      };
    },
    enabled: !!user?.id,
  });

  const statCards = [
    {
      title: 'Véhicules actifs',
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Chauffeurs actifs',
      value: stats?.activeDrivers || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Commissions ce mois',
      value: `${(stats?.monthlyCommissions || 0).toLocaleString()} CDF`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Note moyenne',
      value: stats?.averageRating?.toFixed(1) || '0.0',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="card-floating animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="card-floating border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-body-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-heading-lg font-bold text-card-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
