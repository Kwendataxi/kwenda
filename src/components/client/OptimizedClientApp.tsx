import React, { useState, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Car, Package, ShoppingBag, MapPin } from 'lucide-react';

// Lazy loading des composants lourds
const OptimizedTransportInterface = React.lazy(() => import('@/components/transport/OptimizedTransportInterface'));
const SimpleDeliveryInterface = React.lazy(() => import('@/components/delivery/SimpleDeliveryInterface'));
const MarketplaceInterface = React.lazy(() => import('@/components/marketplace/EnhancedMarketplaceInterface'));

interface OptimizedClientAppProps {
  onNavigate: (path: string) => void;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const ServiceCard = ({ 
  icon: Icon, 
  title, 
  badge, 
  onClick, 
  isActive 
}: { 
  icon: any; 
  title: string; 
  badge?: string; 
  onClick: () => void; 
  isActive: boolean;
}) => (
  <Card 
    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
      isActive ? 'ring-2 ring-primary bg-primary/5' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-6 h-6 text-primary" />
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {badge && (
          <Badge variant="secondary" className="mt-1 text-xs">
            {badge}
          </Badge>
        )}
      </div>
    </div>
  </Card>
);

export const OptimizedClientApp: React.FC<OptimizedClientAppProps> = ({ onNavigate }) => {
  const [activeService, setActiveService] = useState<string>('transport');
  const [loadedServices, setLoadedServices] = useState<Set<string>>(new Set(['transport']));

  const services = [
    { id: 'transport', icon: Car, title: 'Transport', badge: 'VTC & Taxi' },
    { id: 'delivery', icon: Package, title: 'Livraison', badge: 'Flash & Standard' },
    { id: 'marketplace', icon: ShoppingBag, title: 'Marketplace', badge: 'E-commerce' }
  ];

  const handleServiceChange = (serviceId: string) => {
    setActiveService(serviceId);
    if (!loadedServices.has(serviceId)) {
      setLoadedServices(prev => new Set([...prev, serviceId]));
    }
  };

  const renderServiceContent = (serviceId: string) => {
    if (!loadedServices.has(serviceId)) {
      return <LoadingSpinner />;
    }

    switch (serviceId) {
      case 'transport':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <OptimizedTransportInterface onNavigate={onNavigate} />
          </Suspense>
        );
      case 'delivery':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SimpleDeliveryInterface onNavigate={onNavigate} />
          </Suspense>
        );
      case 'marketplace':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <MarketplaceInterface onNavigate={onNavigate} />
          </Suspense>
        );
      case 'location':
        return (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Services de localisation disponibles prochainement</p>
          </div>
        );
      default:
        return <LoadingSpinner />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* En-tête optimisé */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Kwenda Client
          </h1>
          <p className="text-muted-foreground">
            Votre plateforme multimodale pour Kinshasa
          </p>
        </div>

        {/* Navigation par cartes sur mobile */}
        <div className="block md:hidden mb-6">
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                icon={service.icon}
                title={service.title}
                badge={service.badge}
                onClick={() => handleServiceChange(service.id)}
                isActive={activeService === service.id}
              />
            ))}
          </div>
        </div>

        {/* Tabs pour desktop */}
        <Tabs 
          value={activeService} 
          onValueChange={handleServiceChange}
          className="hidden md:block"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {services.map((service) => (
              <TabsTrigger 
                key={service.id} 
                value={service.id}
                className="flex items-center gap-2"
              >
                <service.icon className="w-4 h-4" />
                {service.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {services.map((service) => (
            <TabsContent key={service.id} value={service.id} className="mt-0">
              {renderServiceContent(service.id)}
            </TabsContent>
          ))}
        </Tabs>

        {/* Contenu mobile */}
        <div className="block md:hidden">
          {renderServiceContent(activeService)}
        </div>

        {/* Actions rapides */}
        <div className="fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto md:mt-8">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onNavigate('/support')}
            >
              Support
            </Button>
            <Button 
              size="sm"
              onClick={() => onNavigate('/profile')}
            >
              Profil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};