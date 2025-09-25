import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Car,
  Clock,
  Star,
  Target,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePartnerEarnings } from '@/hooks/usePartnerEarnings';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = "text-primary" 
}) => (
  <Card className="hover:shadow-md transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <div className={`flex items-center text-xs ${
          change.type === 'increase' ? 'text-green-600' : 'text-red-600'
        }`}>
          {change.type === 'increase' ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}% {change.period}
        </div>
      )}
    </CardContent>
  </Card>
);

export const PartnerAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const { data: earningsData, loading } = usePartnerEarnings();

  const performanceMetrics = [
    {
      title: "Revenus Totaux",
      value: "2,450,000 CDF",
      change: { value: 23, type: 'increase' as const, period: 'vs mois dernier' },
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Courses Complétées",
      value: "847",
      change: { value: 15, type: 'increase' as const, period: 'ce mois' },
      icon: Car,
      color: "text-blue-600"
    },
    {
      title: "Taux de Satisfaction",
      value: "4.8/5",
      change: { value: 2, type: 'increase' as const, period: 'cette semaine' },
      icon: Star,
      color: "text-yellow-600"
    },
    {
      title: "Temps Réponse Moy.",
      value: "2.4 min",
      change: { value: 8, type: 'decrease' as const, period: 'amélioration' },
      icon: Clock,
      color: "text-purple-600"
    }
  ];

  const weeklyPerformance = [
    { day: "Lun", rides: 120, revenue: 456000, efficiency: 85 },
    { day: "Mar", rides: 135, revenue: 523000, efficiency: 92 },
    { day: "Mer", rides: 98, revenue: 389000, efficiency: 78 },
    { day: "Jeu", rides: 142, revenue: 568000, efficiency: 94 },
    { day: "Ven", rides: 156, revenue: 624000, efficiency: 98 },
    { day: "Sam", rides: 89, revenue: 342000, efficiency: 76 },
    { day: "Dim", rides: 67, revenue: 258000, efficiency: 68 }
  ];

  const topDrivers = [
    { name: "Jean Kouassi", rides: 89, rating: 4.9, revenue: 234500 },
    { name: "Marie Diallo", rides: 76, rating: 4.8, revenue: 198300 },
    { name: "Paul Yao", rides: 65, rating: 4.7, revenue: 176800 },
    { name: "Fatou Traoré", rides: 58, rating: 4.8, revenue: 164200 },
    { name: "Ahmed Kone", rides: 52, rating: 4.6, revenue: 145600 }
  ];

  const costBreakdown = [
    { category: "Carburant", amount: 185600, percentage: 38, color: "bg-red-500" },
    { category: "Maintenance", amount: 125400, percentage: 26, color: "bg-blue-500" },
    { category: "Assurance", amount: 95200, percentage: 20, color: "bg-green-500" },
    { category: "Divers", amount: 79400, percentage: 16, color: "bg-yellow-500" }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Analytics & Rapports</h1>
          <p className="text-muted-foreground">Analysez vos performances en détail</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="7d">7j</TabsTrigger>
              <TabsTrigger value="30d">30j</TabsTrigger>
              <TabsTrigger value="all">Tout</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {performanceMetrics.map((metric, index) => (
          <AnalyticsCard key={index} {...metric} />
        ))}
      </motion.div>

      {/* Detailed Analytics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="financial">Financier</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Weekly Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Hebdomadaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyPerformance.map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium w-12">{day.day}</span>
                        <div className="flex items-center gap-4 flex-1 mx-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{day.rides} courses</span>
                              <span>{day.revenue.toLocaleString()} CDF</span>
                            </div>
                            <Progress value={(day.rides / 156) * 100} className="h-2" />
                          </div>
                        </div>
                        <Badge variant={day.efficiency >= 90 ? 'default' : day.efficiency >= 75 ? 'secondary' : 'destructive'}>
                          {day.efficiency}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goals & Targets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Objectif Mensuel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Courses</span>
                      <span>847/1000</span>
                    </div>
                    <Progress value={84.7} className="h-2" />
                    <p className="text-xs text-muted-foreground">84.7% atteint</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Revenus Cible</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CDF</span>
                      <span>2.4M/3M</span>
                    </div>
                    <Progress value={80} className="h-2" />
                    <p className="text-xs text-muted-foreground">80% atteint</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rating</span>
                      <span>4.8/5.0</span>
                    </div>
                    <Progress value={96} className="h-2" />
                    <p className="text-xs text-muted-foreground">96% de l'objectif</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {/* Revenue vs Costs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenus Totaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">2,450,000 CDF</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    +23% vs mois dernier
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coûts Opérationnels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500 mb-2">485,600 CDF</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingDown className="h-4 w-4 mr-1 text-green-600" />
                    -5% vs mois dernier
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Coûts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdown.map((cost, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{cost.category}</span>
                        <span className="text-sm font-bold">
                          {cost.amount.toLocaleString()} CDF ({cost.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${cost.color}`}
                          style={{ width: `${cost.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Temps de Réponse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4 min</div>
                  <p className="text-xs text-green-600">-8% amélioration</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Taux d'Annulation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2%</div>
                  <p className="text-xs text-green-600">-0.8% vs mois dernier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Efficacité Opérationnelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-green-600">+5% amélioration</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6">
            {/* Top Drivers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Chauffeurs ce Mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDrivers.map((driver, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-semibold">{driver.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span>{driver.rating}</span>
                            <span>• {driver.rides} courses</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{driver.revenue.toLocaleString()} CDF</p>
                        <p className="text-xs text-muted-foreground">Revenus générés</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};