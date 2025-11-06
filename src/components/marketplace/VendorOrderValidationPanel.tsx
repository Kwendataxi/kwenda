import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Package, MapPin, Calculator } from 'lucide-react';
import { DeliveryMapModal } from './DeliveryMapModal';

interface VendorOrderValidationPanelProps {
  orders: any[];
  onRefresh: () => void;
}

export const VendorOrderValidationPanel = ({ orders, onRefresh }: VendorOrderValidationPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createOrFindConversation } = useUniversalChat();
  const [validatingOrder, setValidatingOrder] = useState<string | null>(null);
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  const [deliveryMethods, setDeliveryMethods] = useState<Record<string, string>>({});
  const [mapModalData, setMapModalData] = useState<{
    orderId: string;
    deliveryCoordinates: { lat: number; lng: number };
    deliveryAddress?: string;
    pickupCoordinates?: { lat: number; lng: number };
  } | null>(null);

  // ✅ PHASE 2: Les commandes sont déjà filtrées par le hook useVendorOrders
  // On garde une sécurité pour filtrer sur vendor_confirmation_status
  const pendingOrders = orders.filter(order => 
    order.vendor_confirmation_status === 'awaiting_confirmation' || 
    order.status === 'pending'
  );

  const calculateDistance = (coords1: any, coords2: any) => {
    if (!coords1 || !coords2) return 0;
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const estimateDeliveryFee = (orderId: string) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (!order?.delivery_coordinates || !order?.pickup_coordinates) {
      toast({ title: "Coordonnées manquantes", description: "Impossible de calculer la distance automatiquement", variant: "destructive" });
      return;
    }

    const distance = calculateDistance(order.pickup_coordinates, order.delivery_coordinates);
    // Base Flash 2025: 7000 FC + 500 FC/km
    const estimatedFee = Math.round(7000 + (distance * 500));
    setDeliveryFees(prev => ({ ...prev, [orderId]: estimatedFee }));
    
    toast({ 
      title: "Estimation calculée", 
      description: `Distance: ${distance.toFixed(1)} km - Frais estimés: ${estimatedFee.toLocaleString()} CDF` 
    });
  };

  const handleValidateOrder = async (orderId: string) => {
    if (!user) return;

    const deliveryFee = deliveryFees[orderId];
    const deliveryMethod = deliveryMethods[orderId] || 'kwenda';

    if (!deliveryFee || deliveryFee <= 0) {
      toast({ title: "Frais requis", description: "Veuillez entrer les frais de livraison", variant: "destructive" });
      return;
    }

    setValidatingOrder(orderId);

    try {
      const { error } = await supabase.functions.invoke('vendor-validate-order', {
        body: {
          orderId,
          vendorId: user.id,
          deliveryFee,
          deliveryMethod,
          selfDelivery: deliveryMethod === 'self'
        }
      });

      if (error) throw error;

      toast({ title: "✅ Commande validée", description: "Le client a reçu votre proposition de frais de livraison" });
      onRefresh();
    } catch (error: any) {
      console.error('Error validating order:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setValidatingOrder(null);
    }
  };

  const handleOpenChat = async (order: any) => {
    try {
      const conversation = await createOrFindConversation(
        'marketplace',
        order.buyer_id,
        order.product_id,
        `Commande ${order.product?.title || 'Marketplace'}`,
        { order_id: order.id, product_id: order.product_id }
      );
      
      if (conversation) {
        toast({
          title: "💬 Chat ouvert",
          description: `Vous pouvez maintenant discuter avec ${order.buyer?.display_name || 'le client'}`,
        });
      }
    } catch (error) {
      console.error('Erreur ouverture chat:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le chat",
        variant: "destructive",
      });
    }
  };

  if (pendingOrders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune commande en attente de validation</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {order.product?.title || 'Produit inconnu'}
                  <Badge variant="outline">Nouvelle commande</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Client: {order.buyer?.display_name || order.buyer_contact || order.buyer_email || 'Client'} • Quantité: {order.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{(order.unit_price * order.quantity).toLocaleString()} CDF</p>
                <p className="text-xs text-muted-foreground">Montant produit</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Adresse de livraison */}
            {(order.delivery_address || order.delivery_coordinates) && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Adresse de livraison:</p>
                  {order.delivery_address ? (
                    <p className="text-muted-foreground">{order.delivery_address}</p>
                  ) : order.delivery_coordinates ? (
                    <p className="text-muted-foreground text-xs">
                      📍 Coordonnées: {order.delivery_coordinates.lat?.toFixed(4)}, {order.delivery_coordinates.lng?.toFixed(4)}
                      <br />
                    <button
                      onClick={() => {
                        setMapModalData({
                          orderId: order.id,
                          deliveryCoordinates: order.delivery_coordinates,
                          deliveryAddress: order.delivery_address,
                          pickupCoordinates: order.pickup_coordinates
                        });
                      }}
                      className="text-primary cursor-pointer hover:underline text-xs font-medium"
                    >
                      🗺️ Voir sur la carte (livreurs disponibles) →
                    </button>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Non renseignée</p>
                  )}
                </div>
              </div>
            )}

            {/* Notes client */}
            {order.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Notes du client:</p>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}

            {/* Configuration frais de livraison */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Frais de livraison</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => estimateDeliveryFee(order.id)}
                  disabled={!order.delivery_coordinates || !order.pickup_coordinates}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Estimer distance
                </Button>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label htmlFor={`fee-${order.id}`}>Montant (CDF)</Label>
                  <Input
                    id={`fee-${order.id}`}
                    type="number"
                    placeholder="Ex: 7000"
                    value={deliveryFees[order.id] || ''}
                    onChange={(e) => setDeliveryFees(prev => ({ ...prev, [order.id]: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Mode de livraison</Label>
                  <RadioGroup
                    value={deliveryMethods[order.id] || 'kwenda'}
                    onValueChange={(value) => setDeliveryMethods(prev => ({ ...prev, [order.id]: value }))}
                    className="grid grid-cols-1 gap-3"
                  >
                    <label 
                      htmlFor={`kwenda-${order.id}`}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        (deliveryMethods[order.id] || 'kwenda') === 'kwenda' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="kwenda" id={`kwenda-${order.id}`} />
                      <div className="flex-1">
                        <p className="font-semibold">🚚 Livreur Kwenda</p>
                        <p className="text-xs text-muted-foreground">Un coursier prendra en charge la livraison automatiquement</p>
                      </div>
                    </label>

                    <label 
                      htmlFor={`self-${order.id}`}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        deliveryMethods[order.id] === 'self' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="self" id={`self-${order.id}`} />
                      <div className="flex-1">
                        <p className="font-semibold">🏍️ Je livre moi-même</p>
                        <p className="text-xs text-muted-foreground">Vous assurerez la livraison personnellement</p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>
              </div>

              {deliveryFees[order.id] > 0 && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-semibold">Total commande</p>
                  <p className="text-2xl font-bold text-primary">
                    {((order.unit_price * order.quantity) + deliveryFees[order.id]).toLocaleString()} CDF
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Produit: {(order.unit_price * order.quantity).toLocaleString()} CDF + Livraison: {deliveryFees[order.id]?.toLocaleString() || 0} CDF
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChat(order)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Discuter
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleValidateOrder(order.id)}
                disabled={validatingOrder === order.id || !deliveryFees[order.id]}
              >
                {validatingOrder === order.id ? 'Validation...' : 'Valider et envoyer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modal carte de livraison */}
      {mapModalData && (
        <DeliveryMapModal
          open={!!mapModalData}
          onClose={() => setMapModalData(null)}
          deliveryCoordinates={mapModalData.deliveryCoordinates}
          deliveryAddress={mapModalData.deliveryAddress}
          pickupCoordinates={mapModalData.pickupCoordinates}
        />
      )}
    </div>
  );
};