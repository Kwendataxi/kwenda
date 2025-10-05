import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUnifiedDeliveryQueue } from '@/hooks/useUnifiedDeliveryQueue';
import { useDriverDeliveryActions } from '@/hooks/useDriverDeliveryActions';
import { MapPin, Package, Clock, Phone, Navigation, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { CancellationDialog } from '@/components/shared/CancellationDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const DeliveryDriverInterface = () => {
  const { user } = useAuth();
  const { deliveries, activeDelivery, acceptDelivery, updateDeliveryStatus, loading } = useUnifiedDeliveryQueue();
  const { confirmPickup, startDelivery, completeDelivery, cancelDelivery, getStatusLabel } = useDriverDeliveryActions();
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleAcceptDelivery = async (deliveryId: string, type: 'marketplace' | 'direct') => {
    const success = await acceptDelivery(deliveryId, type);
    if (success) {
      toast.success('Livraison acceptée');
    }
  };

  const handleConfirmPickup = async () => {
    if (!activeDelivery) return;
    
    const success = await confirmPickup(activeDelivery.id, notes);
    if (success) {
      setNotes('');
      await updateDeliveryStatus('picked_up');
    }
  };

  const handleStartDelivery = async () => {
    if (!activeDelivery) return;
    
    const success = await startDelivery(activeDelivery.id);
    if (success) {
      await updateDeliveryStatus('in_transit');
    }
  };

  const handleCompleteDelivery = async () => {
    if (!activeDelivery || !recipientName) {
      toast.error('Veuillez saisir le nom du destinataire');
      return;
    }
    
    const success = await completeDelivery(activeDelivery.id, recipientName, undefined, notes);
    if (success) {
      setNotes('');
      setRecipientName('');
      await updateDeliveryStatus('delivered');
    }
  };

  const handleCancelDelivery = async (reason: string) => {
    if (!activeDelivery || !user) return;

    const success = await cancelDelivery(activeDelivery.id, reason);
    if (success) {
      setShowCancelDialog(false);
      toast.success('Livraison annulée');
    }
  };

  const getNextAction = () => {
    if (!activeDelivery) return null;
    
    switch (activeDelivery.status) {
      case 'assigned':
      case 'confirmed':
        return (
          <div className="space-y-4">
            <Textarea
              placeholder="Notes de récupération (optionnel)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />
            <Button onClick={handleConfirmPickup} className="w-full" disabled={loading}>
              <Package className="w-4 h-4 mr-2" />
              Confirmer la récupération
            </Button>
          </div>
        );
      case 'picked_up':
        return (
          <Button onClick={handleStartDelivery} className="w-full" disabled={loading}>
            <Navigation className="w-4 h-4 mr-2" />
            Démarrer la livraison
          </Button>
        );
      case 'in_transit':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Nom du destinataire *"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
            <Textarea
              placeholder="Notes de livraison (optionnel)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />
            <Button 
              onClick={handleCompleteDelivery} 
              className="w-full" 
              disabled={loading || !recipientName}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Terminer la livraison
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (activeDelivery) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Livraison en cours</CardTitle>
              <Badge variant="secondary">
                {getStatusLabel(activeDelivery.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pickup Location */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <div>
                  <p className="font-medium text-sm">Récupération</p>
                  <p className="text-sm text-muted-foreground">{activeDelivery.pickup_location}</p>
                </div>
              </div>
            </div>

            {/* Delivery Location */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-secondary mt-1" />
                <div>
                  <p className="font-medium text-sm">Livraison</p>
                  <p className="text-sm text-muted-foreground">{activeDelivery.delivery_location}</p>
                </div>
              </div>
            </div>

            {/* Package Details */}
            {activeDelivery.type === 'direct' && (
              <div className="bg-accent/10 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-accent" />
                  <span className="font-medium text-sm">Détails du colis</span>
                </div>
                {activeDelivery.package_type && (
                  <p className="text-sm">Type: {activeDelivery.package_type}</p>
                )}
                {activeDelivery.vehicle_size && (
                  <p className="text-sm">Véhicule: {activeDelivery.vehicle_size}</p>
                )}
                {activeDelivery.loading_assistance && (
                  <p className="text-sm text-primary">✓ Aide au chargement</p>
                )}
              </div>
            )}

            {/* Marketplace Order Details */}
            {activeDelivery.type === 'marketplace' && activeDelivery.marketplace_order && (
              <div className="bg-accent/10 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-accent" />
                  <span className="font-medium text-sm">Commande marketplace</span>
                </div>
                <p className="text-sm font-medium">{activeDelivery.marketplace_order.product_title}</p>
                <p className="text-sm text-muted-foreground">
                  Vendeur: {activeDelivery.marketplace_order.seller_name}
                </p>
                <p className="text-sm">
                  Montant: {activeDelivery.marketplace_order.total_amount.toLocaleString()} CDF
                </p>
              </div>
            )}

            {/* Fee */}
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">Frais de livraison</span>
              <span className="font-bold text-primary">
                {activeDelivery.estimated_fee.toLocaleString()} CDF
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {getNextAction()}
              
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler la livraison
              </Button>
            </div>
          </CardContent>
        </Card>

        <CancellationDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancelDelivery}
          userType="driver"
          bookingType="delivery"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Livraisons disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Recherche de livraisons...</p>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune livraison disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id} className="border border-border/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant={delivery.type === 'marketplace' ? 'default' : 'secondary'}>
                          {delivery.type === 'marketplace' ? 'Marketplace' : 'Direct'}
                        </Badge>
                        <span className="font-bold text-primary">
                          {delivery.estimated_fee.toLocaleString()} CDF
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Récupération</p>
                            <p className="text-sm text-muted-foreground">{delivery.pickup_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Livraison</p>
                            <p className="text-sm text-muted-foreground">{delivery.delivery_location}</p>
                          </div>
                        </div>
                      </div>

                      {delivery.marketplace_order && (
                        <div className="bg-accent/10 p-2 rounded mb-3">
                          <p className="text-sm font-medium">{delivery.marketplace_order.product_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {delivery.marketplace_order.total_amount.toLocaleString()} CDF
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(delivery.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <Button 
                          onClick={() => handleAcceptDelivery(delivery.id, delivery.type)}
                          disabled={loading}
                          size="sm"
                        >
                          Accepter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryDriverInterface;