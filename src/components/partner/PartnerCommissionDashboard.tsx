import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, DollarSign, Users, Truck, Package } from 'lucide-react';
import { usePartnerCommissions } from '@/hooks/usePartnerCommissions';
import { useIsMobile } from '@/hooks/use-mobile';

export const PartnerCommissionDashboard = () => {
  const { loading, commissions, dailyCommissions, driverSummaries, stats } = usePartnerCommissions();
  const isMobile = useIsMobile();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredCommissions = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return commissions.filter(c => new Date(c.created_at) >= startDate);
  }, [commissions, selectedPeriod]);

  const periodStats = useMemo(() => {
    const totalCommission = filteredCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const transportCommissions = filteredCommissions.filter(c => c.service_type === 'transport');
    const deliveryCommissions = filteredCommissions.filter(c => c.service_type === 'delivery');
    const uniqueDrivers = new Set(filteredCommissions.map(c => c.driver_id)).size;

    return {
      totalCommission,
      totalBookings: filteredCommissions.length,
      transportAmount: transportCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
      deliveryAmount: deliveryCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
      uniqueDrivers,
      averageCommission: filteredCommissions.length > 0 ? totalCommission / filteredCommissions.length : 0
    };
  }, [filteredCommissions]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Aujourd\'hui';
      case 'week': return '7 derniers jours';
      case 'month': return '30 derniers jours';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Total Gagné</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalEarned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium leading-none">Aujourd'hui</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.todayEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium leading-none">Ce Mois</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium leading-none">Taux Moyen</p>
                <p className="text-2xl font-bold">{stats.averageCommissionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="flex space-x-2">
        {(['today', 'week', 'month'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'today' ? 'Aujourd\'hui' : 
             period === 'week' ? '7 jours' : '30 jours'}
          </Button>
        ))}
      </div>

      {/* Period Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Analyse - {getPeriodLabel()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Commission Totale</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(periodStats.totalCommission)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Courses</p>
              <p className="text-xl font-semibold">{periodStats.totalBookings}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Chauffeurs Actifs</p>
              <p className="text-xl font-semibold">{periodStats.uniqueDrivers}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Commission Moyenne</p>
              <p className="text-xl font-semibold">{formatCurrency(periodStats.averageCommission)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="services">Par Service</TabsTrigger>
          <TabsTrigger value="drivers">Par Chauffeur</TabsTrigger>
          {!isMobile && <TabsTrigger value="recent">Récentes</TabsTrigger>}
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span>Transport</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Commission {getPeriodLabel()}:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(periodStats.transportAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Courses:</span>
                    <span>{filteredCommissions.filter(c => c.service_type === 'transport').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Livraison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Commission {getPeriodLabel()}:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(periodStats.deliveryAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Livraisons:</span>
                    <span>{filteredCommissions.filter(c => c.service_type === 'delivery').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {driverSummaries.slice(0, 9).map((driver) => (
              <Card key={driver.driver_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{driver.driver_name}</span>
                    <Badge variant="secondary">{driver.average_rate.toFixed(1)}%</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Commission totale:</span>
                      <span className="font-semibold">{formatCurrency(driver.total_commission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Courses:</span>
                      <span className="text-sm">{driver.total_bookings}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dernière course: {formatDate(driver.last_booking)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {!isMobile && (
          <TabsContent value="recent" className="space-y-4">
            <div className="space-y-3">
              {commissions.slice(0, 10).map((commission) => (
                <Card key={commission.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {commission.service_type === 'transport' ? (
                          <Truck className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Package className="h-4 w-4 text-green-600" />
                        )}
                        <div>
                          <p className="font-medium">{commission.driver_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {commission.service_type === 'transport' ? 'Transport' : 'Livraison'} - 
                            Taux: {commission.commission_rate}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(commission.commission_amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(commission.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};