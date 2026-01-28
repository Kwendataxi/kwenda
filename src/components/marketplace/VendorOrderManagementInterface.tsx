import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Truck, CheckCircle, Clock, MapPin, User, Phone, MessageCircle, Copy } from 'lucide-react';
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
      const { data, error } = await supabase.functions.invoke('handle-order-status-change', {
        body: { 
          orderId: order.id, 
          newStatus: 'ready_for_pickup',
          metadata: { vendor_delivery_method: order.vendor_delivery_method || 'self' }
        }
      });

      if (error) {
        console.error('Erreur edge function ready_for_pickup:', error);
        throw new Error(error.message || 'Erreur serveur');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Échec de la mise à jour');
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
      const { data, error } = await supabase.functions.invoke('handle-order-status-change', {
        body: { 
          orderId: order.id, 
          newStatus: 'in_transit',
          metadata: { self_delivery: true }
        }
      });

      if (error) {
        console.error('Erreur edge function in_transit:', error);
        throw new Error(error.message || 'Erreur serveur');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Échec de la mise à jour');
      }

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
      const { data, error } = await supabase.functions.invoke('handle-order-status-change', {
        body: { 
          orderId: order.id, 
          newStatus: 'delivered',
          metadata: { self_delivery: true }
        }
      });

      if (error) {
        console.error('Erreur edge function delivered:', error);
        throw new Error(error.message || 'Erreur serveur');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Échec de la mise à jour');
      }

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
      case 'pending':
        return {
          icon: Clock,
          label: 'Nouvelle commande',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10'
        };
      case 'pending_buyer_approval':
        return {
          icon: Clock,
          label: 'En attente approbation client',
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10'
        };
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

  // Récupérer les infos client
  const buyerName = order.buyer?.display_name || 'Client';
  const buyerPhone = order.buyer_phone || order.buyer?.phone_number || null;
  const deliveryAddress = order.delivery_address || 'Non spécifiée';

  const handleCopyPhone = () => {
    if (buyerPhone) {
      navigator.clipboard.writeText(buyerPhone);
      toast.success('Numéro copié');
    }
  };

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
    <Card className="p-4 sm:p-6 border-border/40">
      <div className="space-y-5">
        {/* Status actuel */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 sm:p-3 rounded-xl ${statusInfo.bgColor}`}>
              <StatusIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${statusInfo.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Commande #{order.id?.slice(-6)}</h3>
              <Badge variant="outline" className="mt-1 text-xs">
                {statusInfo.label}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg sm:text-xl font-bold text-primary">{order.total_amount?.toLocaleString()} CDF</p>
            <p className="text-xs text-muted-foreground">x{order.quantity}</p>
          </div>
        </div>

        {/* Informations client - AMÉLIORÉES */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Informations client</h4>
          
          {/* Nom du client */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{buyerName}</p>
            </div>
          </div>
          
          {/* Téléphone - cliquable */}
          {buyerPhone && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <a 
                  href={`tel:${buyerPhone}`} 
                  className="font-medium text-primary hover:underline"
                >
                  {buyerPhone}
                </a>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={handleCopyPhone}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <a 
                  href={`https://wa.me/${buyerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                </a>
              </div>
            </div>
          )}
          
          {/* Adresse de livraison */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 mt-0.5">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Adresse de livraison</p>
              <p className="font-medium">{deliveryAddress}</p>
            </div>
          </div>
          
          {/* Mode et frais de livraison */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Truck className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Mode de livraison</p>
              <p className="font-medium">{isSelfDelivery ? 'Auto-gérée' : 'Kwenda'}</p>
            </div>
            {order.delivery_fee > 0 && (
              <Badge variant="secondary" className="text-xs">
                {order.delivery_fee} CDF
              </Badge>
            )}
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
