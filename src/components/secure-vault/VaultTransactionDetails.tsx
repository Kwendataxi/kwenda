import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { Shield, Clock, CheckCircle, AlertCircle, User, Truck, Store } from 'lucide-react';

interface VaultTransactionDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
}

interface TransactionDetail {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  driver_id?: string;
  total_amount: number;
  seller_amount: number;
  driver_amount?: number;
  platform_fee: number;
  currency: string;
  status: string;
  held_at: string;
  released_at?: string;
  completed_at?: string;
  created_at: string;
}

export const VaultTransactionDetails: React.FC<VaultTransactionDetailsProps> = ({
  open,
  onOpenChange,
  transactionId
}) => {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && transactionId) {
      loadTransactionDetails();
    }
  }, [open, transactionId]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      'held': { 
        color: 'bg-secondary text-secondary-foreground', 
        icon: Shield, 
        label: 'Sécurisé',
        description: 'Fonds protégés en attente de confirmation'
      },
      'completed': { 
        color: 'bg-success text-success-foreground', 
        icon: CheckCircle, 
        label: 'Libéré',
        description: 'Fonds transférés avec succès'
      },
      'disputed': { 
        color: 'bg-destructive text-destructive-foreground', 
        icon: AlertCircle, 
        label: 'Litige',
        description: 'Transaction en cours de résolution'
      }
    };
    return configs[status as keyof typeof configs] || configs['held'];
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!transaction) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction introuvable</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Coffre sécurisé #{transaction.order_id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Détails de la transaction sécurisée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut */}
          <div className="flex items-center justify-center">
            <Badge className={`${statusConfig.color} text-lg px-4 py-2`}>
              <StatusIcon className="h-5 w-5 mr-2" />
              {statusConfig.label}
            </Badge>
          </div>

          <p className="text-center text-muted-foreground text-sm">
            {statusConfig.description}
          </p>

          <Separator />

          {/* Répartition des fonds */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">💰 Répartition des fonds</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">T</span>
                  </div>
                  <span className="font-medium">Montant total</span>
                </div>
                <span className="font-bold text-lg">
                  {transaction.total_amount.toLocaleString()} {transaction.currency}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-success" />
                  <span className="font-medium">Vendeur (80%)</span>
                </div>
                <span className="font-bold text-success">
                  {transaction.seller_amount.toLocaleString()} {transaction.currency}
                </span>
              </div>

              {transaction.driver_amount && transaction.driver_amount > 0 && (
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <span className="font-medium">Livreur (15%)</span>
                  </div>
                  <span className="font-bold text-primary">
                    {transaction.driver_amount.toLocaleString()} {transaction.currency}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-xs">K</span>
                  </div>
                  <span className="font-medium">Commission Kwenda (5%)</span>
                </div>
                <span className="font-bold text-muted-foreground">
                  {transaction.platform_fee.toLocaleString()} {transaction.currency}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Chronologie */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">📅 Chronologie</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Fonds sécurisés</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.held_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {transaction.released_at && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-success rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Fonds libérés</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.released_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {transaction.completed_at && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-success rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Transaction terminée</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.completed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Informations techniques */}
          <div className="space-y-2">
            <h3 className="font-semibold">🔧 Informations techniques</h3>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>ID Transaction: {transaction.id}</p>
              <p>ID Commande: {transaction.order_id}</p>
              <p>Créé le: {new Date(transaction.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};