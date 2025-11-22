import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, DollarSign, Star, MapPin, MessageSquare, Crown, Zap } from 'lucide-react';
import { useRideBidding } from '@/hooks/useRideBidding';
import { Skeleton } from '@/components/ui/skeleton';

interface RideBiddingModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  estimatedPrice: number;
  clientProposedPrice?: number;
  onOfferAccepted?: (driverId: string) => void;
}

export const RideBiddingModal = ({
  open,
  onClose,
  bookingId,
  estimatedPrice,
  clientProposedPrice,
  onOfferAccepted
}: RideBiddingModalProps) => {
  const {
    offers,
    biddingActive,
    timeRemaining,
    loading,
    bestOffer,
    enableBidding,
    acceptOffer
  } = useRideBidding({ bookingId, estimatedPrice, enabled: true });

  // Activer automatiquement le bidding à l'ouverture
  useEffect(() => {
    if (open && bookingId) {
      enableBidding(clientProposedPrice || Math.floor(estimatedPrice * 0.8));
    }
  }, [open, bookingId, enableBidding, clientProposedPrice, estimatedPrice]);

  // Accepter une offre de chauffeur
  const handleAcceptOffer = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    const success = await acceptOffer(offerId);
    if (success) {
      onOfferAccepted?.(offer.driver_id);
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold">🎯 Mode enchères actif</span>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {clientProposedPrice && `Votre offre: ${clientProposedPrice.toLocaleString()} CDF`}
              </p>
            </div>
            {biddingActive && (
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Info tarif estimé */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Tarif estimé Kwenda</p>
                <p className="text-2xl font-bold text-foreground">
                  {estimatedPrice.toLocaleString()} <span className="text-base">CDF</span>
                </p>
              </div>
              <Zap className="h-6 w-6 text-primary" />
            </div>
            
            {/* Statistiques des offres */}
            {offers.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/20">
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{offers.length}</p>
                  <p className="text-xs text-muted-foreground">Offres</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {bestOffer ? bestOffer.offered_price.toLocaleString() : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Meilleure</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {offers.length > 0 
                      ? Math.round(offers.reduce((sum, o) => sum + o.offered_price, 0) / offers.length).toLocaleString()
                      : '-'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Moyenne</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Liste des offres */}
        {biddingActive && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Offres reçues ({offers.length})
              </h3>
              {offers.length > 0 && (
                <Badge variant="secondary">
                  Meilleure: {bestOffer?.offered_price.toLocaleString()} CDF
                </Badge>
              )}
            </div>

            {loading && offers.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : offers.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  En attente d'offres des chauffeurs...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les chauffeurs à proximité peuvent voir votre demande
                </p>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                {offers.map((offer, index) => {
                  const isBest = offer.id === bestOffer?.id;
                  const savings = estimatedPrice - offer.offered_price;
                  
                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 260,
                        damping: 20
                      }}
                    >
                      <Card className={`p-4 relative transition-all hover:shadow-lg ${
                        isBest ? 'border-2 border-primary bg-primary/5' : ''
                      }`}>
                        {/* Badge meilleure offre */}
                        {isBest && (
                          <motion.div
                            className="absolute -top-3 right-4"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                              <Crown className="w-3 h-3 mr-1" />
                              Meilleure offre
                            </Badge>
                          </motion.div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Avatar chauffeur */}
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={offer.driver?.photo_url} />
                            <AvatarFallback>
                              {offer.driver?.display_name?.charAt(0) || 'D'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            {/* Nom et note */}
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">
                                {offer.driver?.display_name || 'Chauffeur'}
                              </p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">
                                  {offer.driver?.rating_average?.toFixed(1) || '5.0'}
                                </span>
                              </div>
                            </div>

                            {/* Véhicule et stats */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span>{offer.driver?.vehicle_model || 'Véhicule'}</span>
                              <span>•</span>
                              <span>{offer.driver?.completed_rides || 0} courses</span>
                              {offer.distance_to_pickup && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {offer.distance_to_pickup.toFixed(1)}km
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Message du chauffeur */}
                            {offer.message && (
                              <div className="flex items-start gap-1 bg-muted/50 rounded p-2 mb-2">
                                <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                <p className="text-xs italic">{offer.message}</p>
                              </div>
                            )}

                            {/* Prix et économie */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-bold text-primary">
                                  {offer.offered_price.toLocaleString()}
                                  <span className="text-sm ml-1">CDF</span>
                                </p>
                                {savings > 0 && (
                                  <p className="text-xs text-green-600 dark:text-green-400">
                                    -{savings.toLocaleString()} CDF
                                  </p>
                                )}
                                {savings < 0 && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400">
                                    +{Math.abs(savings).toLocaleString()} CDF
                                  </p>
                                )}
                              </div>

                              {offer.estimated_arrival_time && (
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>~{offer.estimated_arrival_time} min</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bouton accepter */}
                        <Button
                          onClick={() => handleAcceptOffer(offer.id)}
                          disabled={loading}
                          className="w-full mt-3"
                          variant={isBest ? 'default' : 'outline'}
                        >
                          Accepter cette offre
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Info paiement */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          💳 Le paiement se fait après la course (espèces ou mobile money)
        </p>
      </DialogContent>
    </Dialog>
  );
};
