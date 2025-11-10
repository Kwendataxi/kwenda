import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Sparkles, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
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

  const emojis = ['😞', '😕', '🙂', '😊', '🤩'];
  const labels = ['Décevant', 'Moyen', 'Correct', 'Très bien', 'Excellent !'];
  const colors = ['from-red-500', 'from-orange-500', 'from-yellow-500', 'from-green-500', 'from-emerald-500'];
  
  const maxCharacters = 500;
  const currentRating = hoveredRating || rating;

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
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#9370DB'],
            startVelocity: 45,
            gravity: 1.2
          });
          
          // Double confetti burst
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#FFD700', '#FFA500']
            });
          }, 250);
          
          toast.success('🎉 Merci pour les 5 étoiles !', {
            description: 'Votre avis aidera d\'autres clients à choisir cette agence',
            duration: 5000
          });
        } else if (rating >= 4) {
          toast.success('✨ Merci pour votre excellent retour !', {
            description: 'Votre avis compte beaucoup pour nous',
            duration: 4000
          });
        } else {
          toast.success('Merci pour votre avis !', {
            description: 'Votre retour aidera l\'agence à s\'améliorer',
            duration: 4000
          });
        }
      }

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
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-2 shadow-2xl">
        {/* Animated Gradient Header */}
        <motion.div 
          className={`relative p-6 bg-gradient-to-br ${currentRating > 0 ? colors[currentRating - 1] : 'from-primary'} to-primary overflow-hidden`}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ backgroundSize: '200% 200%' }}
        >
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + (i % 3) * 30}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl md:text-3xl text-white font-bold">
              <Sparkles className="h-7 w-7" />
              Noter {partnerName}
            </DialogTitle>
            <DialogDescription className="text-center text-white/90 text-base mt-2">
              Votre avis compte ! Aidez les futurs clients 🚗
            </DialogDescription>
          </DialogHeader>
        </motion.div>

        <div className="p-6 space-y-6 bg-background">
          {/* Stars Rating Section */}
          <div className="flex flex-col items-center space-y-6">
            {/* Stars Container with Glow Effect */}
            <div className="relative">
              {currentRating > 0 && (
                <motion.div
                  className="absolute inset-0 blur-xl opacity-50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.5 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: `radial-gradient(circle, ${
                      currentRating === 5 ? '#fbbf24' :
                      currentRating === 4 ? '#34d399' :
                      currentRating === 3 ? '#fbbf24' :
                      currentRating === 2 ? '#fb923c' : '#ef4444'
                    } 0%, transparent 70%)`
                  }}
                />
              )}
              
              <div className="relative flex gap-3 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-background border-2 border-border/50">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileHover={{ scale: 1.25, rotate: 15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none relative group"
                  >
                    <motion.div
                      animate={
                        value <= currentRating
                          ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                    >
                      <Star
                        className={`h-14 w-14 transition-all duration-300 ${
                          value <= currentRating
                            ? 'fill-yellow-400 stroke-yellow-500 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]'
                            : 'fill-gray-200 stroke-gray-300 dark:fill-gray-700 dark:stroke-gray-600'
                        }`}
                        strokeWidth={2}
                      />
                    </motion.div>
                    
                    {/* Ripple effect on click */}
                    {value === rating && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-yellow-400/30"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Emoji and Label Preview */}
            <AnimatePresence mode="wait">
              {currentRating > 0 && (
                <motion.div
                  key={currentRating}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="text-center space-y-3"
                >
                  <motion.div 
                    className="text-8xl"
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.15, 1.1, 1.15, 1]
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    {emojis[currentRating - 1]}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-1"
                  >
                    <p className={`text-2xl font-extrabold bg-gradient-to-r ${colors[currentRating - 1]} to-primary bg-clip-text text-transparent`}>
                      {labels[currentRating - 1]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentRating}/5 étoiles
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Encouragement message if no rating */}
            {currentRating === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-2 py-4"
              >
                <Heart className="h-12 w-12 mx-auto text-primary/60 animate-pulse" />
                <p className="text-base font-medium text-muted-foreground">
                  Cliquez sur les étoiles pour noter
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Votre avis aide la communauté 🌟
                </p>
              </motion.div>
            )}
          </div>

          {/* Comment Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                💬 Votre commentaire <span className="text-muted-foreground font-normal">(optionnel)</span>
              </span>
              <span className={`text-xs font-mono ${comment.length > maxCharacters ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {comment.length}/{maxCharacters}
              </span>
            </label>
            <Textarea
              placeholder="Partagez votre expérience : qualité des véhicules, service client, tarifs..."
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= maxCharacters) {
                  setComment(e.target.value);
                }
              }}
              rows={4}
              className="resize-none border-2 focus:border-primary transition-all rounded-xl"
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div
            whileHover={{ scale: rating > 0 ? 1.02 : 1 }}
            whileTap={{ scale: rating > 0 ? 0.98 : 1 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`w-full h-14 text-lg font-bold shadow-xl transition-all ${
                rating > 0 
                  ? 'bg-gradient-to-r from-primary to-primary/80 hover:shadow-2xl hover:shadow-primary/50' 
                  : ''
              }`}
              size="lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⭐
                  </motion.div>
                  Envoi en cours...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  {rating > 0 ? `Envoyer ${rating} étoile${rating > 1 ? 's' : ''}` : 'Sélectionnez une note'}
                </span>
              )}
            </Button>
          </motion.div>

          {/* Footer hint */}
          <p className="text-xs text-center text-muted-foreground/70">
            Votre note sera visible publiquement et aidera les futurs clients
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
