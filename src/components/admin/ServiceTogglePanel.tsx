import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_TYPE_TO_VEHICLE_CLASS } from '@/utils/pricingMapper';
import { useQueryClient } from '@tanstack/react-query';
import {
  Car,
  Package,
  ShoppingCart,
  Ticket,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const ServiceTogglePanel = () => {
  const { toast } = useToast();
  const { configurations, loading } = useServiceConfigurations();
  const [refreshKey, setRefreshKey] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const serviceIcons: { [key: string]: any } = {
    'taxi': Car,
    'delivery': Package,
    'rental': Building2,
    'marketplace': ShoppingCart,
    'lottery': Ticket,
  };

  const handleToggle = async (serviceType: string, serviceCategory: string, currentStatus: boolean) => {
    const key = `${serviceType}-${serviceCategory}`;
    setUpdating(key);
    const newStatus = !currentStatus;
    
    try {
      // 1. Mettre à jour service_configurations
      const { error: configError } = await supabase
        .from('service_configurations')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('service_type', serviceType)
        .eq('service_category', serviceCategory);

      if (configError) throw configError;

      // 2. Si c'est un service taxi, synchroniser pricing_rules
      if (serviceCategory === 'taxi') {
        const vehicleClass = SERVICE_TYPE_TO_VEHICLE_CLASS[serviceType];
        
        if (vehicleClass) {
          console.log(`🔄 Syncing pricing_rules for ${vehicleClass}...`);
          
          const { error: pricingError } = await supabase
            .from('pricing_rules')
            .update({ 
              is_active: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('vehicle_class', vehicleClass)
            .eq('service_type', 'transport');

          if (pricingError) {
            console.error('⚠️ Error syncing pricing_rules:', pricingError);
            // Ne pas throw, juste logger
          } else {
            console.log(`✅ Pricing rules synced for ${vehicleClass}`);
          }
        }
      }

      // 3. Log activity
      await supabase.from('activity_logs').insert({
        activity_type: 'service_toggle',
        description: `Service ${serviceType} ${newStatus ? 'activé' : 'désactivé'}`,
        metadata: {
          service_type: serviceType,
          service_category: serviceCategory,
          new_status: newStatus
        }
      });

      // 4. Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['service-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['pricing_rules'] });
      queryClient.invalidateQueries({ queryKey: ['available-taxi-services'] });

      toast({
        title: '✅ Service mis à jour',
        description: `Le service ${serviceType} a été ${newStatus ? 'activé' : 'désactivé'} avec succès.`,
      });

      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('❌ Error toggling service:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier le service',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group by category
  const servicesByCategory = configurations?.reduce((acc: any, config: any) => {
    if (!acc[config.service_category]) {
      acc[config.service_category] = [];
    }
    acc[config.service_category].push(config);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gestion des services</h2>
        <p className="text-muted-foreground">Activez ou désactivez les services affichés aux clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(servicesByCategory || {}).map(([category, services]: [string, any]) => {
          const IconComponent = serviceIcons[category] || Car;
          
          return (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconComponent className="w-5 h-5 text-primary" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {services.map((service: any) => {
                  const key = `${service.service_type}-${service.service_category}`;
                  const isUpdating = updating === key;

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground">
                            {service.display_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {service.service_type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {service.is_active ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                        
                        <Switch
                          checked={service.is_active}
                          disabled={isUpdating}
                          onCheckedChange={() => handleToggle(
                            service.service_type,
                            service.service_category,
                            service.is_active
                          )}
                        />
                        {isUpdating && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceTogglePanel;
