import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Car, 
  ShoppingCart,
  MapPin,
  Clock,
  DollarSign,
  Send,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OrderData {
  type: 'transport' | 'delivery' | 'marketplace';
  pickup: string;
  destination: string;
  price: number;
  notes?: string;
  vehicleClass?: string;
  deliveryMode?: string;
}

export const DriverOrderSimulator = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    type: 'delivery',
    pickup: 'Avenue de la Libération, Gombe',
    destination: 'Marché Central, Kinshasa',
    price: 3500,
    notes: 'Test de commande simulée',
    vehicleClass: 'standard',
    deliveryMode: 'flex'
  });

  const locations = [
    'Avenue de la Libération, Gombe',
    'Marché Central, Kinshasa',
    'Université de Kinshasa, Lemba',
    'Aéroport de N\'djili',
    'Boulevard du 30 juin, Gombe',
    'Commune de Bandalungwa',
    'Kintambo, Ngaliema',
    'Matongé, Kalamu'
  ];

  const createTestTransportOrder = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'create_request',
          userId: user?.id,
          pickupLocation: orderData.pickup,
          pickupCoordinates: { lat: -4.3217, lng: 15.3069 },
          destination: orderData.destination,
          destinationCoordinates: { lat: -4.3317, lng: 15.3169 },
          vehicleClass: orderData.vehicleClass || 'standard'
        }
      });

      if (error) throw error;

      toast.success('Commande transport créée!');
      console.log('Transport order created:', data);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error('Error creating transport order:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestDeliveryOrder = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .insert({
          user_id: user?.id,
          pickup_location: orderData.pickup,
          delivery_location: orderData.destination,
          delivery_coordinates: { lat: -4.3317, lng: 15.3169, type: 'manual' },
          delivery_type: orderData.deliveryMode || 'flex',
          estimated_price: orderData.price,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Déclencher l'assignation automatique
      const { error: dispatchError } = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          action: 'find_drivers',
          order_id: data.id,
          pickup_coordinates: { lat: -4.3217, lng: 15.3069 },
          mode: orderData.deliveryMode || 'flex',
          radius: 5
        }
      });

      if (dispatchError) {
        console.warn('Dispatch error:', dispatchError);
      }

      toast.success('Commande livraison créée!');
      console.log('Delivery order created:', data);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error('Error creating delivery order:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestMarketplaceOrder = async () => {
    setLoading(true);
    try {
      // Créer d'abord une commande marketplace
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          buyer_id: user?.id,
          seller_id: user?.id, // Pour les tests
          product_id: 'test-product-id',
          quantity: 1,
          unit_price: orderData.price / 2,
          total_amount: orderData.price,
          delivery_address: orderData.destination,
          pickup_address: orderData.pickup,
          status: 'confirmed',
          vendor_confirmation_status: 'confirmed'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer l'assignation de livraison
      const { data: assignment, error: assignmentError } = await supabase.functions.invoke('marketplace-driver-assignment', {
        body: {
          action: 'assign_marketplace_driver',
          order_id: order.id,
          driver_id: user?.id,
          pickup_location: orderData.pickup,
          delivery_location: orderData.destination,
          assignment_fee: orderData.price
        }
      });

      if (assignmentError) throw assignmentError;

      toast.success('Commande marketplace créée!');
      console.log('Marketplace order created:', { order, assignment });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error('Error creating marketplace order:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = () => {
    switch (orderData.type) {
      case 'transport':
        return createTestTransportOrder();
      case 'delivery':
        return createTestDeliveryOrder();
      case 'marketplace':
        return createTestMarketplaceOrder();
    }
  };

  const generateRandomOrder = () => {
    const randomPickup = locations[Math.floor(Math.random() * locations.length)];
    const randomDestination = locations[Math.floor(Math.random() * locations.length)];
    const randomPrice = Math.floor(Math.random() * 5000) + 1500;
    
    setOrderData(prev => ({
      ...prev,
      pickup: randomPickup,
      destination: randomDestination,
      price: randomPrice,
      notes: `Commande test générée à ${new Date().toLocaleTimeString()}`
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Simulateur de Commandes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={orderData.type} onValueChange={(value) => setOrderData(prev => ({ ...prev, type: value as any }))}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transport" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Livraison
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Marketplace
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={orderData.type} className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Point de départ</Label>
                <Select 
                  value={orderData.pickup} 
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, pickup: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {location}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination</Label>
                <Select 
                  value={orderData.destination} 
                  onValueChange={(value) => setOrderData(prev => ({ ...prev, destination: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {location}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prix (CDF)</Label>
                <Input
                  type="number"
                  value={orderData.price}
                  onChange={(e) => setOrderData(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
              </div>

              {orderData.type === 'transport' && (
                <div className="space-y-2">
                  <Label>Classe de véhicule</Label>
                  <Select 
                    value={orderData.vehicleClass} 
                    onValueChange={(value) => setOrderData(prev => ({ ...prev, vehicleClass: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {orderData.type === 'delivery' && (
                <div className="space-y-2">
                  <Label>Mode de livraison</Label>
                  <Select 
                    value={orderData.deliveryMode} 
                    onValueChange={(value) => setOrderData(prev => ({ ...prev, deliveryMode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flash">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-100 text-red-800">Flash</Badge>
                          Express (moto)
                        </div>
                      </SelectItem>
                      <SelectItem value="flex">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">Flex</Badge>
                          Standard
                        </div>
                      </SelectItem>
                      <SelectItem value="maxicharge">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">Maxicharge</Badge>
                          Gros colis
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes/Instructions</Label>
              <Input
                value={orderData.notes || ''}
                onChange={(e) => setOrderData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Instructions spéciales..."
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={createTestOrder} 
                disabled={loading}
                className="flex items-center gap-2 flex-1"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Créer Commande Test
              </Button>
              <Button 
                variant="outline" 
                onClick={generateRandomOrder}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Aléatoire
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};