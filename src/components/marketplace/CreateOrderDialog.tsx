import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Package, CreditCard } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller_id: string;
}

interface CreateOrderDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { createOrder } = useMarketplaceOrders();
  
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = product ? quantity * product.price : 0;

  const handleSubmit = async () => {
    if (!product) return;

    setIsSubmitting(true);
    
    try {
      await createOrder(
        product.id,
        product.seller_id,
        quantity,
        product.price,
        deliveryMethod !== 'pickup' ? deliveryAddress : undefined,
        undefined, // coordinates
        deliveryMethod,
        notes
      );

      toast({
        title: t('marketplace.orderCreated'),
        description: t('marketplace.orderCreatedDesc'),
      });

      onSuccess?.();
      onClose();
      
      // Reset form
      setQuantity(1);
      setDeliveryMethod('pickup');
      setDeliveryAddress('');
      setNotes('');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('marketplace.orderCreateError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('marketplace.createOrder')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            {product.images[0] && (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{product.title}</h3>
              <p className="text-sm text-muted-foreground">
                {product.price.toLocaleString()} FC / {t('marketplace.unit')}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('marketplace.quantity')}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label>{t('marketplace.deliveryMethod')}</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {t('marketplace.delivery.pickup')}
                  </div>
                </SelectItem>
                <SelectItem value="home">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('marketplace.delivery.home')}
                  </div>
                </SelectItem>
                <SelectItem value="office">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('marketplace.delivery.office')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Address */}
          {deliveryMethod !== 'pickup' && (
            <div className="space-y-2">
              <Label htmlFor="address">{t('marketplace.deliveryAddress')}</Label>
              <Textarea
                id="address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={t('marketplace.deliveryAddressPlaceholder')}
                rows={3}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('marketplace.orderNotes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('marketplace.orderNotesPlaceholder')}
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {t('marketplace.subtotal')}
              </span>
              <span className="text-sm">
                {totalAmount.toLocaleString()} FC
              </span>
            </div>
            {deliveryMethod !== 'pickup' && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {t('marketplace.deliveryFee')}
                </span>
                <span className="text-sm">
                  {t('marketplace.calculated')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold text-lg border-t pt-2">
              <span>{t('marketplace.total')}</span>
              <span>{totalAmount.toLocaleString()} FC</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('marketplace.escrowPayment')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('marketplace.escrowPaymentDesc')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || (deliveryMethod !== 'pickup' && !deliveryAddress.trim())}
            >
              {isSubmitting ? t('common.loading') : t('marketplace.placeOrder')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};