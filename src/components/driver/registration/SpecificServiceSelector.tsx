import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Bike, Car, Truck, Zap, Clock, Package2 } from 'lucide-react';
import { useServiceConfigurations, ServiceCategory } from '@/hooks/useServiceConfigurations';

interface SpecificServiceSelectorProps {
  serviceCategory: ServiceCategory;
  selectedService: string | null;
  onServiceSelect: (serviceType: string) => void;
  disabled?: boolean;
}

export const SpecificServiceSelector: React.FC<SpecificServiceSelectorProps> = ({
  serviceCategory,
  selectedService,
  onServiceSelect,
  disabled = false,
}) => {
  const { configurations, getServicePricing, formatPrice, loading } = useServiceConfigurations();

  const getServiceIcon = (serviceType: string) => {
    const iconMap: Record<string, any> = {
      moto: Bike,
      eco: Car,
      confort: Car,
      premium: Car,
      flash: Zap,
      flex: Clock,
      maxicharge: Truck,
    };
    return iconMap[serviceType] || Package2;
  };

  const getServiceBadgeColor = (serviceType: string) => {
    const colorMap: Record<string, string> = {
      moto: 'bg-orange-100 text-orange-800',
      eco: 'bg-green-100 text-green-800',
      confort: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      flash: 'bg-red-100 text-red-800',
      flex: 'bg-yellow-100 text-yellow-800',
      maxicharge: 'bg-gray-100 text-gray-800',
    };
    return colorMap[serviceType] || 'bg-gray-100 text-gray-800';
  };

  const services = configurations.filter(config => config.service_category === serviceCategory);
  const categoryTitle = serviceCategory === 'taxi' ? 'Taxi' : 'Livraison';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Choisissez votre service {categoryTitle}
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez le type de service spécifique que vous souhaitez offrir
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = getServiceIcon(service.service_type);
          const isSelected = selectedService === service.service_type;
          const pricing = getServicePricing(service.service_type, service.service_category);
          
          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onServiceSelect(service.service_type)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{service.display_name}</CardTitle>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <CardDescription className="text-sm">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tarification */}
                {pricing && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-foreground mb-1">Tarification</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Base: {formatPrice(pricing.base_price)}</div>
                      <div>Par km: {formatPrice(pricing.price_per_km)}</div>
                      <div>Commission: {pricing.commission_rate}%</div>
                    </div>
                  </div>
                )}

                {/* Caractéristiques */}
                <div>
                  <div className="text-sm font-medium text-foreground mb-2">Caractéristiques</div>
                  <div className="flex flex-wrap gap-1">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`text-xs ${getServiceBadgeColor(service.service_type)}`}
                      >
                        {feature}
                      </Badge>
                    ))}
                    {service.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.features.length - 3} autres
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Exigences */}
                <div>
                  <div className="text-sm font-medium text-foreground mb-2">Exigences</div>
                  <div className="text-xs text-muted-foreground">
                    {service.requirements.slice(0, 2).map((req, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        {req}
                      </div>
                    ))}
                    {service.requirements.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{service.requirements.length - 2} autres exigences
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                  disabled={disabled}
                >
                  {isSelected ? 'Service sélectionné' : 'Choisir ce service'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};