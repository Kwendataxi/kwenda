import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Truck, CheckCircle, Clock, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface VendorOrderManagementInterfaceProps {
  order: any;
  onStatusUpdate?: () => void;
}

export const VendorOrderManagementInterface: React.FC<VendorOrderManagementInterfaceProps> = ({
  order,
  onStatusUpdate
}) => {
  const [loading, setLoading] = useState(false);

  const handleMarkReadyForPickup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'ready_for_pickup',
          ready_for_pickup_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        console.error('Erreur mise à jour ready_for_pickup:', error);
        throw error;
      }

      // Notifier le client
      await supabase.from('push_notifications').insert({
        user_id: order.buyer_id,
        title: '📦 Colis prêt !',
        message: `Votre commande est prête et attend d'être expédiée`,
        notification_type: 'marketplace_order',
        metadata: { order_id: order.id }
      });

      // Si Kwenda, notifier le livreur assigné
      if (order.vendor_delivery_method === 'kwenda' && order.marketplace_delivery_assignments?.[0]) {
        await supabase.from('push_notifications').insert({
          user_id: order.marketplace_delivery_assignments[0].driver_id,
          title: '📦 Colis disponible',
          message: `Le colis est prêt pour récupération`,
          notification_type: 'delivery_assignment',
          metadata: { order_id: order.id }
        });
      }

      toast.success('Commande marquée comme prête pour livraison');
      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(`Erreur: ${error.message || 'Erreur lors de la mise à jour'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSelfDelivery = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'in_transit',
          in_transit_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        console.error('Erreur mise à jour in_transit:', error);
        throw error;
      }

      await supabase.from('push_notifications').insert({
        user_id: order.buyer_id,
        title: '🚗 Livraison en cours',
        message: `Le vendeur a commencé la livraison de votre commande`,
        notification_type: 'marketplace_delivery',
        metadata: { order_id: order.id }
      });

      toast.success('Livraison démarrée');
      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error starting delivery:', error);
      toast.error(`Erreur: ${error.message || 'Erreur lors du démarrage'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSelfDelivery = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        console.error('Erreur mise à jour delivered:', error);
        throw error;
      }

      await supabase.from('push_notifications').insert({
        user_id: order.buyer_id,
        title: '✅ Colis livré',
        message: `Le vendeur a marqué votre commande comme livrée. Confirmez la réception.`,
        notification_type: 'marketplace_delivery',
        metadata: { order_id: order.id }
      });

      toast.success('Livraison marquée comme terminée');
      onStatusUpdate?.();
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      toast.error(`Erreur: ${error.message || 'Erreur lors de la finalisation'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (order.status) {
      case 'confirmed':
        return {
          icon: Clock,
          label: 'En attente de préparation',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10'
        };
      case 'ready_for_pickup':
        return {
          icon: Package,
          label: 'Prêt pour livraison',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10'
        };
      case 'assigned_to_driver':
        return {
          icon: Truck,
          label: 'Livreur assigné',
          color: 'text-indigo-500',
          bgColor: 'bg-indigo-500/10'
        };
      case 'picked_up_by_driver':
        return {
          icon: Truck,
          label: 'Récupéré par livreur',
          color: 'text-cyan-500',
          bgColor: 'bg-cyan-500/10'
        };
      case 'in_transit':
        return {
          icon: Truck,
          label: 'En cours de livraison',
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10'
        };
      case 'delivered':
        return {
          icon: CheckCircle,
          label: 'Livré (en attente confirmation client)',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Terminée',
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10'
        };
      default:
        return {
          icon: Package,
          label: order.status,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  // Fallback: si vendor_delivery_method n'est pas défini, considérer comme self-delivery
  const deliveryMethod = order.vendor_delivery_method || 'self';
  const isSelfDelivery = deliveryMethod === 'self';
  const isKwendaDelivery = deliveryMethod === 'kwenda';

  const handleSetDeliveryMethod = async (method: 'self' | 'kwenda') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({
          vendor_delivery_method: method,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;
      toast.success(method === 'self' ? 'Vous livrerez vous-même' : 'Livreur Kwenda assigné');
      onStatusUpdate?.();
    } catch (error) {
      console.error('Error setting delivery method:', error);
      toast.error('Erreur lors de la configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Status actuel */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${statusInfo.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Gestion de la commande</h3>
              <Badge variant="outline" className="mt-1">
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Informations livraison */}
        <div className="space-y-2 text-sm">
          {/* Nom du client */}
          {order.buyer?.display_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p>
                <span className="font-medium">Client:</span> {order.buyer.display_name}
                {order.buyer_phone && ` • ${order.buyer_phone}`}
              </p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Adresse de livraison</p>
              <p className="text-muted-foreground">{order.delivery_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <p>
              <span className="font-medium">Mode de livraison:</span>{' '}
              {isSelfDelivery ? 'Auto-gérée' : 'Kwenda'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <p>
              <span className="font-medium">Frais de livraison:</span>{' '}
              {order.delivery_fee} CDF ({order.delivery_fee_payment_method === 'cash_on_delivery' ? 'Espèces' : 'KwendaPay'})
            </p>
          </div>
        </div>

        {/* Choix du mode de livraison si non défini */}
        {!order.vendor_delivery_method && order.status === 'confirmed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3"
          >
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              ⚠️ Choisissez votre mode de livraison :
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSetDeliveryMethod('self')}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                🚗 Je livre moi-même
              </Button>
              <Button
                onClick={() => handleSetDeliveryMethod('kwenda')}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                🚚 Livreur Kwenda
              </Button>
            </div>
          </motion.div>
        )}

        {/* Actions selon le statut et mode de livraison */}
        <div className="space-y-3">
          {/* Bouton "Prêt pour livraison" - visible si confirmed (avec ou sans delivery method défini) */}
          {order.status === 'confirmed' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleMarkReadyForPickup}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Marquer comme prêt pour livraison
              </Button>
              {isKwendaDelivery && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Le livreur Kwenda sera notifié automatiquement
                </p>
              )}
            </motion.div>
          )}

          {order.status === 'ready_for_pickup' && isSelfDelivery && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleStartSelfDelivery}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                <Truck className="h-5 w-5 mr-2" />
                Je commence la livraison
              </Button>
            </motion.div>
          )}

          {order.status === 'in_transit' && isSelfDelivery && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleCompleteSelfDelivery}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Marquer comme livré
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                À faire uniquement après remise du colis au client
              </p>
            </motion.div>
          )}

          {order.status === 'ready_for_pickup' && isKwendaDelivery && (
            <div className="text-center py-4 bg-indigo-500/10 rounded-lg">
              <Truck className="h-8 w-8 text-indigo-500 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                🚚 En attente de récupération par le livreur Kwenda
              </p>
            </div>
          )}

          {(order.status === 'assigned_to_driver' || order.status === 'picked_up_by_driver') && (
            <div className="text-center py-4 bg-cyan-500/10 rounded-lg">
              <Truck className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                {order.status === 'assigned_to_driver' 
                  ? '🚚 Livreur en route pour récupérer le colis' 
                  : '📦 Colis récupéré, en route vers le client'}
              </p>
            </div>
          )}

          {order.status === 'in_transit' && isKwendaDelivery && (
            <div className="text-center py-4 bg-purple-500/10 rounded-lg">
              <Truck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                🚗 Livraison en cours par le livreur Kwenda
              </p>
            </div>
          )}

          {order.status === 'delivered' && (
            <div className="text-center py-4 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-700">✅ Livraison terminée !</p>
              <p className="text-sm text-muted-foreground mt-1">
                Le client a 7 jours pour confirmer. Passé ce délai, les fonds seront automatiquement libérés.
              </p>
              <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <span className="font-medium">Astuce:</span> Vous serez notifié dès que le client confirme ou après 7 jours.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info escrow */}
        {order.payment_status === 'held' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💰 <span className="font-medium">Fonds sécurisés:</span> {order.total_amount} FC sont en séquestre
              et seront transférés après confirmation du client (5% de commission plateforme)
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
