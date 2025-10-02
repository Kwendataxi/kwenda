import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverRideNotifications from './DriverRideNotifications';
import DemandHeatmapView from './DemandHeatmapView';
import { Car, MapPin, Clock, Star, TrendingUp } from 'lucide-react';

export function DriverDashboard() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Tableau de Bord Chauffeur</h1>
          <p className="text-muted-foreground">Gérez vos courses et restez disponible</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Statut du Chauffeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-500">
                  En ligne
                </Badge>
                <Badge variant="secondary">
                  Disponible
                </Badge>
              </div>
              <Button variant="outline" size="sm">
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Courses vs Zones Rentables */}
        <Tabs defaultValue="rides" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rides">
              <Car className="h-4 w-4 mr-2" />
              Mes Courses
            </TabsTrigger>
            <TabsTrigger value="heatmap">
              <TrendingUp className="h-4 w-4 mr-2" />
              Zones Rentables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rides" className="space-y-4">
            {/* Ride Notifications */}
            <DriverRideNotifications />
          </TabsContent>

          <TabsContent value="heatmap">
            {/* Demand Heatmap */}
            <DemandHeatmapView />
          </TabsContent>
        </Tabs>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Courses aujourd'hui</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Temps en ligne</p>
                  <p className="text-2xl font-bold">8h 30m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <p className="text-2xl font-bold">4.8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}