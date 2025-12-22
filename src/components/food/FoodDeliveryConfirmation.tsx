import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FoodDeliveryConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  totalAmount: number;
  onConfirmed?: () => void;
}

export const FoodDeliveryConfirmation: React.FC<FoodDeliveryConfirmationProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  restaurantName,
  totalAmount,
  onConfirmed
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (rating === 0) {
      toast.error('Veuillez donner une note au restaurant');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase.functions.invoke('release-food-escrow', {
        body: {
          orderId,
          rating,
          feedback: feedback.trim() || undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Réception confirmée !', {
          description: `${data.restaurantAmount?.toLocaleString()} CDF ont été versés au restaurant`
        });
        onConfirmed?.();
        onClose();
      } else {
        throw new Error(data?.error || 'Erreur lors de la confirmation');
      }
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de confirmer la réception'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Confirmer la réception
          </DialogTitle>
          <DialogDescription>
            Commande #{orderNumber} de {restaurantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info escrow */}
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Paiement sécurisé</p>
                <p className="text-xs text-muted-foreground mt-1">
                  En confirmant, {totalAmount.toLocaleString()} CDF seront libérés au restaurant (95% après commission)
                </p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Notez votre expérience *
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoveredRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 && "😞 Très déçu"}
              {rating === 2 && "😕 Pas satisfait"}
              {rating === 3 && "😐 Correct"}
              {rating === 4 && "😊 Satisfait"}
              {rating === 5 && "🤩 Excellent !"}
            </p>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || rating === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
