import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { Settings, DollarSign, Users, TrendingUp } from 'lucide-react';

export const ServiceManagementPanel: React.FC = () => {
  const { configurations, pricing, formatPrice, updatePricing } = useServiceConfigurations();
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [pricingForm, setPricingForm] = useState({
    base_price: 0,
    price_per_km: 0,
    price_per_minute: 0,
    minimum_fare: 0,
    commission_rate: 0,
  });

  const handleEditPricing = (pricingItem: any) => {
    setEditingPricing(pricingItem.id);
    setPricingForm({
      base_price: pricingItem.base_price,
      price_per_km: pricingItem.price_per_km,
      price_per_minute: pricingItem.price_per_minute || 0,
      minimum_fare: pricingItem.minimum_fare,
      commission_rate: pricingItem.commission_rate,
    });
  };

  const handleSavePricing = () => {
    if (!editingPricing) return;
    
    updatePricing({
      id: editingPricing,
      ...pricingForm,
    });
    
    setEditingPricing(null);
  };

  const getServicesByCategory = (category: 'taxi' | 'delivery') => {
    return configurations.filter(config => config.service_category === category);
  };

  const getPricingForService = (serviceType: string, serviceCategory: string) => {
    return pricing.find(p => p.service_type === serviceType && p.service_category === serviceCategory);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Gestion des Services
        </h2>
        <p className="text-muted-foreground">
          Configurez les services et la tarification pour les chauffeurs et livreurs
        </p>
      </div>

      <Tabs defaultValue="taxi" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="taxi">Services Taxi</TabsTrigger>
          <TabsTrigger value="delivery">Services Livraison</TabsTrigger>
        </TabsList>

        <TabsContent value="taxi" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {getServicesByCategory('taxi').map((service) => {
              const servicePricing = getPricingForService(service.service_type, service.service_category);
              
              return (
                <Card key={service.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.display_name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {service.service_type}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {servicePricing && (
                      <div className="space-y-2">
                        {editingPricing === servicePricing.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Prix de base</Label>
                              <Input
                                type="number"
                                value={pricingForm.base_price}
                                onChange={(e) => setPricingForm(prev => ({
                                  ...prev,
                                  base_price: Number(e.target.value)
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Prix/km</Label>
                              <Input
                                type="number"
                                value={pricingForm.price_per_km}
                                onChange={(e) => setPricingForm(prev => ({
                                  ...prev,
                                  price_per_km: Number(e.target.value)
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Commission (%)</Label>
                              <Input
                                type="number"
                                value={pricingForm.commission_rate}
                                onChange={(e) => setPricingForm(prev => ({
                                  ...prev,
                                  commission_rate: Number(e.target.value)
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSavePricing}
                                className="flex-1"
                              >
                                Sauver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingPricing(null)}
                                className="flex-1"
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Base:</span>
                              <span className="font-medium">{formatPrice(servicePricing.base_price)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Par km:</span>
                              <span className="font-medium">{formatPrice(servicePricing.price_per_km)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Commission:</span>
                              <span className="font-medium">{servicePricing.commission_rate}%</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditPricing(servicePricing)}
                              className="w-full mt-2"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Caractéristiques</div>
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 2).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getServicesByCategory('delivery').map((service) => {
              const servicePricing = getPricingForService(service.service_type, service.service_category);
              
              return (
                <Card key={service.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.display_name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {service.service_type}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {servicePricing && (
                      <div className="space-y-2">
                        {editingPricing === servicePricing.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Prix de base</Label>
                              <Input
                                type="number"
                                value={pricingForm.base_price}
                                onChange={(e) => setPricingForm(prev => ({
                                  ...prev,
                                  base_price: Number(e.target.value)
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Prix/km</Label>
                              <Input
                                type="number"
                                value={pricingForm.price_per_km}
                                onChange={(e) => setPricingForm(prev => ({
                                  ...prev,
                                  price_per_km: Number(e.target.value)
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Commission (%)</Label>
                              <Input
                                type="number"
                                value={pricingForm.commission_rate}
                                onChange={(e) => setPricingForm(prev => ({
                                  ...prev,
                                  commission_rate: Number(e.target.value)
                                }))}
                                className="h-8"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSavePricing}
                                className="flex-1"
                              >
                                Sauver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingPricing(null)}
                                className="flex-1"
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Base:</span>
                              <span className="font-medium">{formatPrice(servicePricing.base_price)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Par km:</span>
                              <span className="font-medium">{formatPrice(servicePricing.price_per_km)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Commission:</span>
                              <span className="font-medium">{servicePricing.commission_rate}%</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditPricing(servicePricing)}
                              className="w-full mt-2"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Caractéristiques</div>
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 2).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};