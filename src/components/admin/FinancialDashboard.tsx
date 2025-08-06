import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Car, 
  Package,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RealtimeFinancialWidget } from './RealtimeFinancialWidget';

interface FinancialMetrics {
  totalRevenue: number;
  adminCommission: number;
  driverEarnings: number;
  platformFees: number;
  transportRevenue: number;
  deliveryRevenue: number;
  activeDrivers: number;
  completedRides: number;
  revenueGrowth: number;
}

interface TransactionSummary {
  date: string;
  service_type: string;
  total_amount: number;
  admin_commission: number;
  driver_earnings: number;
  transaction_count: number;
}

export const FinancialDashboard = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    adminCommission: 0,
    driverEarnings: 0,
    platformFees: 0,
    transportRevenue: 0,
    deliveryRevenue: 0,
    activeDrivers: 0,
    completedRides: 0,
    revenueGrowth: 0
  });
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const { toast } = useToast();

  useEffect(() => {
    updateDateRange();
  }, [selectedPeriod]);

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const updateDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (selectedPeriod) {
      case 'current_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'last_3_months':
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case 'current_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    setDateRange({ start, end });
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch wallet transactions for the period
      const { data: transactions, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          wallet:wallet_id(user_id)
        `)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .eq('status', 'completed');

      if (transactionsError) throw transactionsError;

      // Fetch activity logs for commission breakdown
      const { data: activities, error: activitiesError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'payment')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (activitiesError) throw activitiesError;

      // Fetch transport bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (bookingsError) throw bookingsError;

      // Fetch delivery orders
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (deliveriesError) throw deliveriesError;

      // Calculate metrics
      const totalRevenue = (transactions || [])
        .filter(t => t.transaction_type === 'debit' && t.description?.includes('Paiement'))
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const driverEarnings = (transactions || [])
        .filter(t => t.transaction_type === 'credit' && t.description?.includes('Gains'))
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const transportRevenue = (bookings || [])
        .reduce((sum, b) => sum + (parseFloat(b.actual_price?.toString() || '0')), 0);

      const deliveryRevenue = (deliveries || [])
        .reduce((sum, d) => sum + (parseFloat(d.actual_price?.toString() || '0')), 0);

      // Calculate admin commission (estimate based on commission rates)
      const adminCommission = totalRevenue * 0.10; // Assuming 10% admin rate
      const platformFees = totalRevenue * 0.05; // Assuming 5% platform rate

      // Get active drivers count
      const { data: activeDriversData } = await supabase
        .from('driver_locations')
        .select('driver_id')
        .eq('is_online', true)
        .eq('is_available', true);

      const activeDrivers = activeDriversData?.length || 0;

      // Calculate growth (compare with previous period)
      const previousStart = new Date(dateRange.start);
      previousStart.setMonth(previousStart.getMonth() - 1);
      const previousEnd = new Date(dateRange.end);
      previousEnd.setMonth(previousEnd.getMonth() - 1);

      const { data: previousTransactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('transaction_type', 'debit')
        .eq('status', 'completed')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      const previousRevenue = (previousTransactions || [])
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const revenueGrowth = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      setMetrics({
        totalRevenue,
        adminCommission,
        driverEarnings,
        platformFees,
        transportRevenue,
        deliveryRevenue,
        activeDrivers,
        completedRides: (bookings?.length || 0) + (deliveries?.length || 0),
        revenueGrowth
      });

      // Process transaction summary by day
      const dailySummary = (activities || []).reduce((acc: any, activity) => {
        const date = format(new Date(activity.created_at), 'yyyy-MM-dd');
        const serviceType = activity.reference_type || 'other';
        
        if (!acc[date]) {
          acc[date] = {};
        }
        if (!acc[date][serviceType]) {
          acc[date][serviceType] = {
            total_amount: 0,
            admin_commission: 0,
            driver_earnings: 0,
            transaction_count: 0
          };
        }

        acc[date][serviceType].total_amount += parseFloat(activity.amount?.toString() || '0');
        acc[date][serviceType].transaction_count += 1;
        
        return acc;
      }, {});

      const summaryArray: TransactionSummary[] = [];
      Object.entries(dailySummary).forEach(([date, services]: [string, any]) => {
        Object.entries(services).forEach(([serviceType, data]: [string, any]) => {
          summaryArray.push({
            date,
            service_type: serviceType,
            total_amount: data.total_amount,
            admin_commission: data.total_amount * 0.10,
            driver_earnings: data.total_amount * 0.85,
            transaction_count: data.transaction_count
          });
        });
      });

      setTransactionSummary(summaryArray);

    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // Simple CSV export
      const csvData = [
        ['Date', 'Service', 'Montant Total', 'Commission Admin', 'Gains Chauffeur', 'Nb Transactions'],
        ...transactionSummary.map(item => [
          item.date,
          item.service_type,
          item.total_amount.toFixed(2),
          item.admin_commission.toFixed(2),
          item.driver_earnings.toFixed(2),
          item.transaction_count.toString()
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Succès",
        description: "Rapport exporté avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Dashboard Financier
        </h2>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mois Actuel</SelectItem>
              <SelectItem value="last_month">Mois Dernier</SelectItem>
              <SelectItem value="last_3_months">3 Derniers Mois</SelectItem>
              <SelectItem value="current_year">Année Actuelle</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Financial Widget */}
      <RealtimeFinancialWidget />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRevenue.toLocaleString()} CDF</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(metrics.revenueGrowth).toFixed(1)}% vs période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Admin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.adminCommission.toLocaleString()} CDF</div>
            <div className="text-xs text-muted-foreground">
              {((metrics.adminCommission / metrics.totalRevenue) * 100).toFixed(1)}% du total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gains Chauffeurs</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.driverEarnings.toLocaleString()} CDF</div>
            <div className="text-xs text-muted-foreground">
              {((metrics.driverEarnings / metrics.totalRevenue) * 100).toFixed(1)}% du total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeDrivers}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.completedRides} courses complétées
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  <span>Transport VTC</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{metrics.transportRevenue.toLocaleString()} CDF</div>
                  <div className="text-xs text-muted-foreground">
                    {((metrics.transportRevenue / metrics.totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  <span>Livraison</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{metrics.deliveryRevenue.toLocaleString()} CDF</div>
                  <div className="text-xs text-muted-foreground">
                    {((metrics.deliveryRevenue / metrics.totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution des Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Commission Admin (10%)</span>
                <span className="font-semibold">{metrics.adminCommission.toLocaleString()} CDF</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gains Chauffeurs (85%)</span>
                <span className="font-semibold">{metrics.driverEarnings.toLocaleString()} CDF</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Frais Plateforme (5%)</span>
                <span className="font-semibold">{metrics.platformFees.toLocaleString()} CDF</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune transaction trouvée pour cette période
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-right p-2">Montant Total</th>
                    <th className="text-right p-2">Commission</th>
                    <th className="text-right p-2">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionSummary.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        {format(new Date(item.date), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="capitalize">
                          {item.service_type}
                        </Badge>
                      </td>
                      <td className="text-right p-2">
                        {item.total_amount.toLocaleString()} CDF
                      </td>
                      <td className="text-right p-2">
                        {item.admin_commission.toLocaleString()} CDF
                      </td>
                      <td className="text-right p-2">
                        {item.transaction_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};