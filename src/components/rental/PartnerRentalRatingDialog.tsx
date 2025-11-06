import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface PartnerRentalRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
  onRatingSubmitted?: () => void;
}

export const PartnerRentalRatingDialog = ({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  onRatingSubmitted
}: PartnerRentalRatingDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojis = ['😞', '😕', '🚗', '😊', '😍'];
  const labels = ['Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent'];

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour noter');
      return;
    }

    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    try {
      setIsSubmitting(true);

      // Récupérer l'user_id du partenaire
      const { data: partner, error: partnerError } = await supabase
        .from('partenaires')
        .select('user_id')
        .eq('id', partnerId)
        .single();

      if (partnerError) throw partnerError;

      // Vérifier si l'utilisateur a déjà noté ce partenaire
      const { data: existingRating } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rater_user_id', user.id)
        .eq('rated_user_id', partner.user_id)
        .eq('rating_context', 'rental_partner')
        .maybeSingle();

      if (existingRating) {
        // Update existing rating
        const { error: updateError } = await supabase
          .from('user_ratings')
          .update({
            rating,
            comment
          })
          .eq('id', existingRating.id);

        if (updateError) throw updateError;
        toast.success('Votre note a été mise à jour');
      } else {
        // Create new rating
        const { error: insertError } = await supabase
          .from('user_ratings')
          .insert({
            rater_user_id: user.id,
            rated_user_id: partner.user_id,
            rating,
            comment,
            rating_context: 'rental_partner'
          });

        if (insertError) throw insertError;
        toast.success('Merci pour votre avis !');
      }

      // Rafraîchir les stats
      await supabase.rpc('refresh_partner_rental_stats');

      onRatingSubmitted?.();
      onOpenChange(false);
      setRating(0);
      setComment('');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error('Erreur lors de l\'envoi de la note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Noter {partnerName}</DialogTitle>
          <DialogDescription>
            Partagez votre expérience avec cette agence de location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stars */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <motion.button
                  key={value}
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-all ${
                      value <= (hoveredRating || rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            {/* Emoji and label */}
            {(hoveredRating || rating) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-5xl mb-2">
                  {emojis[(hoveredRating || rating) - 1]} 🏎️
                </div>
                <p className="font-medium text-lg">
                  {labels[(hoveredRating || rating) - 1]}
                </p>
              </motion.div>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Votre commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience de location avec cette agence..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma note'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
