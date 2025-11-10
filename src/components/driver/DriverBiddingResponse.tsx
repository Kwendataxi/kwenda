import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, TrendingDown, TrendingUp, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Minus } from 'lucide-react';

interface DriverBiddingResponseProps {
  bookingId: string;
  clientProposedPrice: number;
  estimatedPrice: number;
  pickupLocation: string;
  distanceToPickup: number;
  onResponseSubmitted?: () => void;
}

export default function DriverBiddingResponse({
  bookingId,
  clientProposedPrice,
  estimatedPrice,
  pickupLocation,
  distanceToPickup,
  onResponseSubmitted
}: DriverBiddingResponseProps) {
  const [loading, setLoading] = useState(false);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterOfferPrice, setCounterOfferPrice] = useState(
    Math.floor((clientProposedPrice + estimatedPrice) / 2) // Milieu entre les deux
  );

  const increment = 100; // 100 CDF
  const minCounterOffer = clientProposedPrice + increment;
  const maxCounterOffer = estimatedPrice;

  const discount = ((estimatedPrice - clientProposedPrice) / estimatedPrice * 100).toFixed(1);
  const isLowOffer = clientProposedPrice < estimatedPrice * 0.7; // Moins de 70% du prix

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Récupérer l'ID du chauffeur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: driver } = await supabase
        .from('chauffeurs')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) throw new Error('Profil chauffeur non trouvé');

      // Créer l'offre (acceptation directe)
      const { error: offerError } = await supabase
        .from('ride_offers')
        .insert({
          ride_request_id: bookingId,
          driver_id: driver.id,
          status: 'pending'
        } as any);

      if (offerError) throw offerError;

      toast.success('✅ Offre acceptée !', {
        description: 'Le client a été notifié de votre acceptation'
      });

      onResponseSubmitted?.();
    } catch (error) {
      console.error('❌ Error accepting offer:', error);
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: driver } = await supabase
        .from('chauffeurs')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) throw new Error('Profil chauffeur non trouvé');

      // Créer la contre-offre
      const { error: offerError } = await supabase
        .from('ride_offers')
        .insert({
          ride_request_id: bookingId,
          driver_id: driver.id,
          status: 'pending'
        } as any);

      if (offerError) throw offerError;

      toast.success('💰 Contre-offre envoyée !', {
        description: `${counterOfferPrice.toLocaleString()} CDF proposés au client`
      });

      onResponseSubmitted?.();
    } catch (error) {
      console.error('❌ Error sending counter-offer:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuse = () => {
    toast.info('Course ignorée');
    onResponseSubmitted?.();
  };

  if (showCounterOffer) {
    return (
      <Card className="p-4 space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-lg">Votre contre-offre</h3>
          <p className="text-xs text-muted-foreground">
            Le client a proposé {clientProposedPrice.toLocaleString()} CDF
          </p>
        </div>

        {/* Ajuster la contre-offre */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCounterOfferPrice(prev => Math.max(prev - increment, minCounterOffer))}
            disabled={counterOfferPrice <= minCounterOffer}
          >
            <Minus className="h-5 w-5" />
          </Button>

          <div className="px-6 py-3 bg-primary/10 border-2 border-primary/30 rounded-xl min-w-[160px] text-center">
            <p className="text-2xl font-bold">{counterOfferPrice.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">CDF</p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCounterOfferPrice(prev => Math.min(prev + increment, maxCounterOffer))}
            disabled={counterOfferPrice >= maxCounterOffer}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCounterOffer(false)}
            disabled={loading}
            className="flex-1"
          >
            Retour
          </Button>
          <Button
            onClick={handleCounterOffer}
            disabled={loading}
            className="flex-1"
          >
            Envoyer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="p-4 space-y-4">
        {/* Header */}
        <div className="text-center">
          <h3 className="font-bold text-lg">🎯 Nouvelle demande de course</h3>
          {isLowOffer && (
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 text-xs mt-1">
              <TrendingDown className="w-4 h-4" />
              <span>Offre {discount}% inférieure au tarif</span>
            </div>
          )}
        </div>

        {/* Comparaison prix */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">Prix Kwenda</p>
            <p className="text-xl font-bold text-foreground">
              {estimatedPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">CDF</p>
          </div>

          <div className="p-3 bg-primary/10 border-2 border-primary/30 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">Offre client</p>
            <p className="text-xl font-bold text-primary">
              {clientProposedPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">CDF</p>
          </div>
        </div>

        {/* Détails */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              📍 {distanceToPickup.toFixed(1)} km de vous
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            ✅ Accepter {clientProposedPrice.toLocaleString()} CDF
          </Button>

          <Button
            onClick={() => setShowCounterOffer(true)}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            💰 Contre-offre
          </Button>

          <Button
            onClick={handleRefuse}
            disabled={loading}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Refuser
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
