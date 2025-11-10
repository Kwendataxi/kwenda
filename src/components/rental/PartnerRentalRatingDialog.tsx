import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Car, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

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
  
  const maxCharacters = 500;

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
        
        toast.success('Votre note a été mise à jour', {
          description: 'Merci pour votre retour !',
          duration: 4000
        });
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
        
        // 🎉 Confetti pour 5 étoiles !
        if (rating === 5) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#9370DB']
          });
          
          toast.success('🎉 Merci pour les 5 étoiles !', {
            description: 'Votre avis aidera d\'autres clients à choisir cette agence',
            duration: 5000
          });
        } else {
          toast.success('Merci pour votre avis !', {
            description: 'Votre retour aidera l\'agence à s\'améliorer',
            duration: 4000
          });
        }
      }

      // Stats se rafraîchissent automatiquement via trigger

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
      <DialogContent className="max-w-md backdrop-blur-xl bg-background/95 border-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Noter {partnerName}
          </DialogTitle>
          <DialogDescription className="text-base">
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
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none relative"
                >
                  <Star
                    className={`h-12 w-12 transition-all duration-300 ${
                      value <= (hoveredRating || rating)
                        ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            {/* Emoji and label */}
            {(hoveredRating || rating) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center"
              >
                <motion.div 
                  className="text-7xl mb-3"
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {emojis[(hoveredRating || rating) - 1]} 🏎️
                </motion.div>
                <p className="font-bold text-xl bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {labels[(hoveredRating || rating) - 1]}
                </p>
              </motion.div>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>Votre commentaire (optionnel)</span>
              <span className={`text-xs ${comment.length > maxCharacters ? 'text-destructive' : 'text-muted-foreground'}`}>
                {comment.length}/{maxCharacters}
              </span>
            </label>
            <Textarea
              placeholder="Partagez votre expérience de location avec cette agence..."
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= maxCharacters) {
                  setComment(e.target.value);
                }
              }}
              rows={4}
              className="resize-none border-2 focus:border-primary transition-all"
            />
          </div>

          {/* Submit button */}
          <motion.div
            whileHover={{ scale: rating > 0 ? 1.02 : 1 }}
            whileTap={{ scale: rating > 0 ? 0.98 : 1 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="w-full shadow-lg"
              size="lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⭐
                  </motion.div>
                  Envoi en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Envoyer ma note
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
