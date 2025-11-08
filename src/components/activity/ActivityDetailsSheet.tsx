import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { CreditCard, Package, ShoppingBag, ArrowLeftRight, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  item: UnifiedActivityItem | null;
  onOpenChange: (open: boolean) => void;
}

export const ActivityDetailsSheet = ({ open, item, onOpenChange }: Props) => {
  const navigate = useNavigate();
  
  if (!item) return null;

  const icon =
    item.type === 'delivery' ? <Package className="h-5 w-5" /> :
    item.type === 'payment' ? <CreditCard className="h-5 w-5" /> :
    item.type === 'wallet_transfer' ? <ArrowLeftRight className="h-5 w-5" /> :
    <ShoppingBag className="h-5 w-5" />;

  const handleTrackDelivery = () => {
    const deliveryId = item.raw?.id || item.raw?.delivery_order_id || item.raw?.order_id;
    
    if (!deliveryId) {
      toast.error('Impossible de suivre cette livraison');
      return;
    }
    
    onOpenChange(false);
    navigate(`/tracking/delivery/${deliveryId}`);
  };

  const handleContact = () => {
    if (item.type === 'delivery') {
      const driverPhone = item.raw?.driver_phone || item.raw?.chauffeur?.phone_number;
      if (driverPhone) {
        window.location.href = `tel:${driverPhone}`;
      } else {
        toast.info('Numéro du chauffeur non disponible');
      }
    }
    
    if (item.type === 'marketplace_purchase' || item.type === 'marketplace_sale') {
      const contactPhone = item.raw?.seller_phone || item.raw?.buyer_phone;
      if (contactPhone) {
        window.location.href = `tel:${contactPhone}`;
      } else {
        toast.info('Numéro de contact non disponible');
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">{icon} Détails</SheetTitle>
          <SheetDescription>
            {item.title}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Section spécifique pour les transferts */}
          {item.type === 'wallet_transfer' && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                <span>Informations du transfert</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-medium">{item.counterpartyName || 'Inconnu'}</span>
                </div>
                {item.raw?.sender_balance_before != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Solde avant</span>
                    <span className="font-medium">{item.raw.sender_balance_before.toLocaleString()} {item.currency}</span>
                  </div>
                )}
                {item.raw?.sender_balance_after != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Solde après</span>
                    <span className="font-medium">{item.raw.sender_balance_after.toLocaleString()} {item.currency}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informations générales */}
          <div className="space-y-2 text-sm">
            {item.amount != null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-lg">{item.amount.toLocaleString()} {item.currency || 'CDF'}</span>
              </div>
            )}
            {item.status && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statut</span>
                <span className="font-medium capitalize">{item.status}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{new Date(item.timestamp).toLocaleString('fr-FR')}</span>
            </div>
            {item.raw?.id && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Référence</span>
                <span className="font-mono text-xs">{String(item.raw.id).slice(0, 8)}</span>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6">
          {item.type === 'delivery' && (
            <Button className="w-full" onClick={handleTrackDelivery}>Suivre la livraison</Button>
          )}
          {item.type !== 'payment' && (
            <Button variant="secondary" className="w-full" onClick={handleContact}>Contacter</Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Fermer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
