import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PieChart, DollarSign, TrendingDown } from 'lucide-react';

export const CommissionBreakdown: React.FC = () => {
  const { user } = useAuth();

  const { data: commissionData } = useQuery({
    queryKey: ['driver-commissions', user?.id],
    queryFn: async () => {
      // Récupérer les courses du mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: bookings } = await supabase
        .from('transport_bookings')
        .select('actual_price')
        .eq('driver_id', user?.id)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('actual_price')
        .eq('driver_id', user?.id)
        .eq('status', 'delivered')
        .gte('created_at', startOfMonth.toISOString());

      const totalRevenue = [
        ...(bookings || []),
        ...(deliveries || [])
      ].reduce((sum, order) => sum + (order.actual_price || 0), 0);

      // Commission plateforme (5%)
      const platformCommission = totalRevenue * 0.05;
      
      // Commission partenaire (10% si applicable)
      const { data: partnerDriver } = await supabase
        .from('partner_drivers')
        .select('partner_id')
        .eq('driver_id', user?.id)
        .maybeSingle();

      const hasPartner = !!partnerDriver?.partner_id;
      const partnerCommission = hasPartner ? totalRevenue * 0.10 : 0;
      
      // Gains nets
      const netEarnings = totalRevenue - platformCommission - partnerCommission;

      return {
        totalRevenue: Math.round(totalRevenue),
        platformCommission: Math.round(platformCommission),
        partnerCommission: Math.round(partnerCommission),
        netEarnings: Math.round(netEarnings),
        hasPartner,
      };
    },
    enabled: !!user?.id,
  });

  const breakdown = [
    {
      label: 'Gains nets',
      amount: commissionData?.netEarnings || 0,
      percentage: commissionData?.totalRevenue 
        ? ((commissionData.netEarnings / commissionData.totalRevenue) * 100).toFixed(0)
        : '0',
      color: 'text-green-600',
      icon: DollarSign,
    },
    {
      label: 'Frais plateforme',
      amount: commissionData?.platformCommission || 0,
      percentage: '5',
      color: 'text-orange-600',
      icon: TrendingDown,
    },
    ...(commissionData?.hasPartner ? [{
      label: 'Commission partenaire',
      amount: commissionData?.partnerCommission || 0,
      percentage: '10',
      color: 'text-blue-600',
      icon: PieChart,
    }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Répartition des gains (ce mois)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">Chiffre d'affaires total</p>
          <p className="text-2xl font-bold">{commissionData?.totalRevenue?.toLocaleString() || 0} CDF</p>
        </div>

        {breakdown.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.amount.toLocaleString()} CDF</p>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              </div>
              <Progress value={parseInt(item.percentage)} className="h-2" />
            </div>
          );
        })}

        {commissionData?.hasPartner && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 Vous êtes rattaché à un partenaire qui reçoit 10% de commission.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommissionBreakdown;
