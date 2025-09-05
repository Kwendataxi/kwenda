import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CleanLocationPicker } from '@/components/location/CleanLocationPicker';
import { 
  ArrowLeft,
  ArrowRight,
  MapPin, 
  Navigation,
  User,
  Phone
} from 'lucide-react';
import { type UnifiedLocation } from '@/types/locationAdapter';

interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface ContactInfo {
  name: string;
  phone: string;
}

interface DeliveryData {
  pickup: {
    location: DeliveryLocation | null;
    contact: ContactInfo;
  };
  destination: {
    location: DeliveryLocation | null;
    contact: ContactInfo;
  };
}

interface SimpleDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const SimpleDeliveryInterface: React.FC<SimpleDeliveryInterfaceProps> = ({ 
  onSubmit, 
  onCancel 
}) => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickup: { location: null, contact: { name: '', phone: '' } },
    destination: { location: null, contact: { name: '', phone: '' } }
  });

  const { toast } = useToast();

  const handlePickupLocationSelect = (location: UnifiedLocation) => {
    const deliveryLocation: DeliveryLocation = {
      address: location.address,
      coordinates: { lat: location.lat, lng: location.lng }
    };
    
    setDeliveryData(prev => ({
      ...prev,
      pickup: { ...prev.pickup, location: deliveryLocation }
    }));

    toast({
      title: "Point de collecte confirmé",
      description: "📍 " + location.address,
    });
  };

  const handleDestinationLocationSelect = (location: UnifiedLocation) => {
    const deliveryLocation: DeliveryLocation = {
      address: location.address,
      coordinates: { lat: location.lat, lng: location.lng }
    };
    
    setDeliveryData(prev => ({
      ...prev,
      destination: { ...prev.destination, location: deliveryLocation }
    }));

    toast({
      title: "Point de livraison confirmé", 
      description: "🎯 " + location.address,
    });
  };

  const canProceed = () => {
    return deliveryData.pickup.location && 
           deliveryData.destination.location && 
           deliveryData.pickup.contact.name && 
           deliveryData.pickup.contact.phone &&
           deliveryData.destination.contact.name;
  };

  const handleSubmit = () => {
    if (canProceed()) {
      onSubmit(deliveryData);
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter tous les champs requis",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header moderne */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Nouvelle livraison
            </h1>
            <div className="w-16" />
          </div>
          
          <Progress value={50} className="w-full h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Configuration des adresses
          </p>
        </div>

        {/* Interface épurée */}
        <Card className="glassmorphism animate-fade-in border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Adresses de livraison
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Point de collecte moderne */}
            <div>
              <label className="block text-sm font-medium mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Point de collecte *
              </label>
              
              <CleanLocationPicker
                type="pickup"
                onLocationSelect={handlePickupLocationSelect}
                autoFocus={true}
              />

              {/* Contact collecte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Nom du contact *
                  </label>
                  <Input
                    placeholder="Nom complet"
                    value={deliveryData.pickup.contact.name}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, name: e.target.value } }
                    }))}
                    className="h-12 rounded-xl border-border/20 bg-card/50 backdrop-blur-sm
                              hover:border-primary/30 focus:border-primary/50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Téléphone *
                  </label>
                  <Input
                    placeholder="+243 xxx xxx xxx"
                    value={deliveryData.pickup.contact.phone}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, phone: e.target.value } }
                    }))}
                    className="h-12 rounded-xl border-border/20 bg-card/50 backdrop-blur-sm
                              hover:border-primary/30 focus:border-primary/50 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Point de destination moderne */}
            <div>
              <label className="block text-sm font-medium mb-4 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-secondary" />
                Point de livraison *
              </label>
              
              <CleanLocationPicker
                type="destination"
                onLocationSelect={handleDestinationLocationSelect}
                showCurrentLocation={false}
              />

              {/* Contact destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Nom du destinataire *
                  </label>
                  <Input
                    placeholder="Nom du destinataire"
                    value={deliveryData.destination.contact.name}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, contact: { ...prev.destination.contact, name: e.target.value } }
                    }))}
                    className="h-12 rounded-xl border-border/20 bg-card/50 backdrop-blur-sm
                              hover:border-secondary/30 focus:border-secondary/50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Téléphone (optionnel)
                  </label>
                  <Input
                    placeholder="+243 xxx xxx xxx"
                    value={deliveryData.destination.contact.phone}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, contact: { ...prev.destination.contact, phone: e.target.value } }
                    }))}
                    className="h-12 rounded-xl border-border/20 bg-card/50 backdrop-blur-sm
                              hover:border-secondary/30 focus:border-secondary/50 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Bouton continuer moderne */}
            <div className="pt-6">
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="w-full h-14 text-base font-medium rounded-xl
                          bg-gradient-to-r from-primary to-primary/90 
                          hover:from-primary/90 hover:to-primary
                          disabled:from-grey-300 disabled:to-grey-400
                          transition-all duration-300 transform
                          hover:scale-[1.02] active:scale-[0.98]
                          shadow-lg hover:shadow-xl"
              >
                Continuer vers les services
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleDeliveryInterface;