import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Settings, AlertTriangle, Calculator, TrendingUp, Users } from 'lucide-react';

interface PartnerDriver {
  id: string;
  driver_name: string;
  commission_rate: number;
  is_active: boolean;
  total_rides: number;
  total_earnings: number;
}

export const PartnerCommissionSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<PartnerDriver[]>([]);
  const [globalRate, setGlobalRate] = useState<number>(1.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, [user]);

  const loadDrivers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get partner drivers
      const { data: partnerDrivers, error } = await supabase
        .from('partner_drivers')
        .select('*')
        .eq('partner_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Transform data and get additional stats
      const driverData: PartnerDriver[] = [];
      
      for (const item of partnerDrivers || []) {
        // Get driver profile
        const { data: driverProfile } = await supabase
          .from('driver_profiles')
          .select('user_id')
          .eq('user_id', item.driver_id)
          .single();

        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', item.driver_id)
          .single();
        
        // Get ride stats
        const { data: rideStats } = await supabase
          .from('transport_bookings')
          .select('actual_price')
          .eq('driver_id', item.driver_id)
          .eq('status', 'completed');

        const totalRides = rideStats?.length || 0;
        const totalEarnings = rideStats?.reduce((sum, ride) => sum + (ride.actual_price || 0), 0) || 0;

        driverData.push({
          id: item.id,
          driver_name: profile?.display_name || 'Chauffeur',
          commission_rate: Number(item.commission_rate || 1.5),
          is_active: item.status === 'active',
          total_rides: totalRides,
          total_earnings: totalEarnings
        });
      }

      setDrivers(driverData);
      
      // Set global rate from the first driver or default
      if (driverData.length > 0) {
        setGlobalRate(driverData[0].commission_rate);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les chauffeurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDriverRate = async (driverId: string, newRate: number) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('partner_drivers')
        .update({ 
          commission_rate: newRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      // Update local state
      setDrivers(prev => prev.map(driver => 
        driver.id === driverId 
          ? { ...driver, commission_rate: newRate }
          : driver
      ));

      toast({
        title: "Succès",
        description: "Taux de commission mis à jour",
      });
    } catch (error) {
      console.error('Error updating rate:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le taux",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyGlobalRate = async () => {
    setSaving(true);
    try {
      const updates = drivers.map(driver => ({
        id: driver.id,
        commission_rate: globalRate,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        await supabase
          .from('partner_drivers')
          .update(update)
          .eq('id', update.id);
      }

      // Update local state
      setDrivers(prev => prev.map(driver => ({
        ...driver,
        commission_rate: globalRate
      })));

      toast({
        title: "Succès",
        description: `Taux de ${globalRate}% appliqué à tous les chauffeurs`,
      });
    } catch (error) {
      console.error('Error applying global rate:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer le taux global",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateProjectedCommission = (earnings: number, rate: number) => {
    return (earnings * rate) / 100;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Paramètres des Commissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Vous pouvez définir un taux de commission jusqu'à 2,5% maximum par chauffeur. 
              Cette commission est prélevée sur la part du chauffeur.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Taux Global</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Taux de commission global (%)</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[globalRate]}
                onValueChange={(value) => setGlobalRate(value[0])}
                max={2.5}
                min={0}
                step={0.1}
                className="flex-1"
              />
              <div className="w-20">
                <Input
                  type="number"
                  value={globalRate}
                  onChange={(e) => setGlobalRate(Math.min(2.5, Math.max(0, Number(e.target.value))))}
                  min={0}
                  max={2.5}
                  step={0.1}
                />
              </div>
              <Badge variant={globalRate > 2 ? "destructive" : "secondary"}>
                {globalRate.toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          <Button 
            onClick={applyGlobalRate} 
            disabled={saving || drivers.length === 0}
            className="w-full"
          >
            Appliquer à tous les chauffeurs ({drivers.length})
          </Button>
        </CardContent>
      </Card>

      {/* Individual Driver Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Commissions Individuelles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun chauffeur associé trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {drivers.map((driver, index) => (
                <div key={driver.id}>
                  {index > 0 && <Separator />}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{driver.driver_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{driver.total_rides} courses</span>
                          <span>Gains: {formatCurrency(driver.total_earnings)}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={driver.commission_rate > 2 ? "destructive" : "default"}
                      >
                        {driver.commission_rate.toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <Label className="w-32">Commission:</Label>
                        <Slider
                          value={[driver.commission_rate]}
                          onValueChange={(value) => {
                            const newRate = value[0];
                            setDrivers(prev => prev.map(d => 
                              d.id === driver.id 
                                ? { ...d, commission_rate: newRate }
                                : d
                            ));
                          }}
                          max={2.5}
                          min={0}
                          step={0.1}
                          className="flex-1"
                        />
                        <div className="w-20">
                          <Input
                            type="number"
                            value={driver.commission_rate}
                            onChange={(e) => {
                              const newRate = Math.min(2.5, Math.max(0, Number(e.target.value)));
                              setDrivers(prev => prev.map(d => 
                                d.id === driver.id 
                                  ? { ...d, commission_rate: newRate }
                                  : d
                              ));
                            }}
                            min={0}
                            max={2.5}
                            step={0.1}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => updateDriverRate(driver.id, driver.commission_rate)}
                          disabled={saving}
                        >
                          Sauver
                        </Button>
                      </div>

                      {/* Projection */}
                      <div className="bg-muted/30 p-2 rounded text-sm">
                        <div className="flex justify-between">
                          <span>Commission projetée (sur gains actuels):</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(calculateProjectedCommission(driver.total_earnings, driver.commission_rate))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Résumé des commissions</p>
              <div className="text-blue-800 space-y-1">
                <p>• Taux moyen: {drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.commission_rate, 0) / drivers.length).toFixed(1) : 0}%</p>
                <p>• Commission totale potentielle: {formatCurrency(drivers.reduce((sum, d) => sum + calculateProjectedCommission(d.total_earnings, d.commission_rate), 0))}</p>
                <p>• Les chauffeurs seront notifiés des changements de taux</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};