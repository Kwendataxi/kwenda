import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Users, Calendar, Car, Target } from 'lucide-react';

export const RentalFinancialDashboard = () => {
  const [timeRange, setTimeRange] = useState('30');

  // Mock data pour les statistiques financières
  const revenueStats = {
    totalRevenue: 2450000,
    activeSubscriptions: 15,
    totalSubscriptions: 18,
    conversionRate: 83.3,
    revenueByCategory: [
      { name: 'ECO', value: 980000 },
      { name: 'PREMIUM', value: 857500 },
      { name: 'FIRST CLASS', value: 490000 },
      { name: 'UTILITAIRES', value: 122500 }
    ]
  };

  // Mock data pour les séries temporelles
  const timeSeriesData = [
    { date: '2024-01-01', revenue: 145000, subscriptions: 3 },
    { date: '2024-01-02', revenue: 200000, subscriptions: 4 },
    { date: '2024-01-03', revenue: 175000, subscriptions: 2 },
    { date: '2024-01-04', revenue: 320000, subscriptions: 6 },
    { date: '2024-01-05', revenue: 280000, subscriptions: 5 }
  ];

  // Mock data pour les top partenaires
  const topPartners = [
    { name: 'Partenaire Premium Auto', revenue: 485000, subscriptions: 8 },
    { name: 'Congo Fleet Services', revenue: 320000, subscriptions: 5 },
    { name: 'Kinshasa Transport Plus', revenue: 290000, subscriptions: 4 },
    { name: 'Eco Vehicles RDC', revenue: 215000, subscriptions: 3 }
  ];

  const statCards = [
    {
      title: "Revenus Total",
      value: `${revenueStats?.totalRevenue?.toLocaleString() || 0} CDF`,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Abonnements Actifs",
      value: revenueStats?.activeSubscriptions || 0,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Taux de Conversion",
      value: `${Math.round(revenueStats?.conversionRate || 0)}%`,
      icon: Target,
      color: "text-purple-600"
    },
    {
      title: "Total Souscriptions",
      value: revenueStats?.totalSubscriptions || 0,
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Financier Location</h2>
          <p className="text-muted-foreground">
            Analyse des revenus et performances des abonnements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des revenus */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('fr', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('fr')}
                  formatter={(value: number) => [`${value.toLocaleString()} CDF`, 'Revenus']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenus par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueStats?.revenueByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueStats?.revenueByCategory?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} CDF`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Partenaires */}
      <Card>
        <CardHeader>
          <CardTitle>Top Partenaires par Revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPartners?.map((partner: any, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {partner.subscriptions} abonnement(s)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{partner.revenue.toLocaleString()} CDF</p>
                </div>
              </div>
            )) || (
              <p className="text-center text-muted-foreground py-8">
                Aucune donnée disponible pour cette période
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Graphique des nouvelles souscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelles Souscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('fr')}
                formatter={(value: number) => [value, 'Nouvelles souscriptions']}
              />
              <Bar dataKey="subscriptions" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};