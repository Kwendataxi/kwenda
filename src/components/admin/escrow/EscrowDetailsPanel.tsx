import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  X, 
  User, 
  Store, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  MessageSquare,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EscrowDetailsPanelProps {
  escrow: {
    id: string;
    order_id: string;
    buyer_id: string;
    seller_id: string;
    total_amount: number;
    platform_fee: number;
    seller_amount: number;
    status: string;
    created_at: string;
    released_at?: string | null;
    dispute_reason?: string | null;
  };
  onClose: () => void;
  onAction: (
    escrowId: string, 
    action: 'force_release' | 'force_refund' | 'open_dispute' | 'resolve_dispute',
    adminNotes?: string,
    resolution?: any
  ) => Promise<void>;
  actionLoading: string | null;
}

interface UserInfo {
  id: string;
  display_name?: string;
  email?: string;
  phone_number?: string;
}

export const EscrowDetailsPanel: React.FC<EscrowDetailsPanelProps> = ({
  escrow,
  onClose,
  onAction,
  actionLoading
}) => {
  const [buyerInfo, setBuyerInfo] = useState<UserInfo | null>(null);
  const [sellerInfo, setSellerInfo] = useState<UserInfo | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [escrow.id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      // Charger les infos acheteur
      const { data: buyer } = await supabase
        .from('clients')
        .select('user_id, display_name, email, phone_number')
        .eq('user_id', escrow.buyer_id)
        .maybeSingle();

      if (buyer) {
        setBuyerInfo({
          id: buyer.user_id,
          display_name: buyer.display_name,
          email: buyer.email,
          phone_number: buyer.phone_number
        });
      }

      // Charger les infos vendeur
      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('user_id, shop_name')
        .eq('user_id', escrow.seller_id)
        .maybeSingle();

      if (vendor) {
        setSellerInfo({
          id: vendor.user_id,
          display_name: vendor.shop_name
        });
      }

      // Charger les infos commande
      const { data: order } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products (
            title,
            price,
            images
          )
        `)
        .eq('id', escrow.order_id)
        .maybeSingle();

      setOrderInfo(order);

    } catch (error) {
      console.error('Error loading escrow details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'held':
        return <Badge className="bg-amber-500/20 text-amber-400">En attente</Badge>;
      case 'disputed':
        return <Badge className="bg-red-500/20 text-red-400">Conflit</Badge>;
      case 'released':
        return <Badge className="bg-green-500/20 text-green-400">Libéré</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-500/20 text-blue-400">Remboursé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isLoading = actionLoading === escrow.id;

  return (
    <Card className="fixed right-0 top-0 h-full w-full max-w-lg z-50 rounded-none border-l shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Détails Escrow</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <CardContent className="space-y-6 pb-24">
          {/* Status & Amount */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-3xl font-bold">{escrow.total_amount?.toLocaleString()} FC</p>
            </div>
            {getStatusBadge(escrow.status)}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Répartition
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Montant vendeur</p>
                <p className="text-lg font-semibold text-green-500">
                  {escrow.seller_amount?.toLocaleString()} FC
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Commission plateforme</p>
                <p className="text-lg font-semibold text-primary">
                  {escrow.platform_fee?.toLocaleString()} FC
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Parties */}
          <div className="space-y-4">
            <h4 className="font-medium">Parties concernées</h4>
            
            {/* Buyer */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Acheteur</p>
                <p className="text-sm text-muted-foreground">
                  {buyerInfo?.display_name || 'Chargement...'}
                </p>
                {buyerInfo?.phone_number && (
                  <p className="text-xs text-muted-foreground">{buyerInfo.phone_number}</p>
                )}
              </div>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="p-2 bg-purple-500/20 rounded-full">
                <Store className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Vendeur</p>
                <p className="text-sm text-muted-foreground">
                  {sellerInfo?.display_name || 'Chargement...'}
                </p>
                {sellerInfo?.phone_number && (
                  <p className="text-xs text-muted-foreground">{sellerInfo.phone_number}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Info */}
          {orderInfo && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Commande
              </h4>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">{orderInfo.marketplace_products?.title}</p>
                <p className="text-sm text-muted-foreground">
                  Quantité: {orderInfo.quantity} × {orderInfo.marketplace_products?.price?.toLocaleString()} FC
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Statut: {orderInfo.status}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Dispute Info if exists */}
          {escrow.status === 'disputed' && escrow.dispute_reason && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Conflit en cours
              </h4>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm">{escrow.dispute_reason}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Créé le {format(new Date(escrow.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                </span>
              </div>
              {escrow.released_at && (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    Libéré le {format(new Date(escrow.released_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Admin Notes */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes admin
            </h4>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ajouter des notes pour le suivi..."
              rows={3}
            />
          </div>

          {/* Actions */}
          {(escrow.status === 'held' || escrow.status === 'disputed') && (
            <div className="space-y-3">
              <h4 className="font-medium">Actions admin</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onAction(escrow.id, 'force_release', adminNotes)}
                  disabled={isLoading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Libérer les fonds
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onAction(escrow.id, 'force_refund', adminNotes)}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rembourser
                </Button>
              </div>
              
              {escrow.status === 'held' && (
                <Button
                  variant="outline"
                  className="w-full border-amber-500 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => onAction(escrow.id, 'open_dispute', adminNotes)}
                  disabled={isLoading}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Ouvrir un conflit
                </Button>
              )}

              {escrow.status === 'disputed' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onAction(escrow.id, 'resolve_dispute', adminNotes)}
                  disabled={isLoading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Résoudre le conflit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default EscrowDetailsPanel;
