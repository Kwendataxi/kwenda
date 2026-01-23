import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, TrendingDown, Star, MapPin, Check, X } from 'lucide-react';
import { useClientBidding } from '@/hooks/useClientBidding';

interface BiddingStatusPanelProps {
  bookingId: string;
  estimatedPrice: number;
  onDriverAccepted: (driverId: string) => void;
  onCancel: () => void;
}

export default function BiddingStatusPanel({
  bookingId,
  estimatedPrice,
  onDriverAccepted,
  onCancel
}: BiddingStatusPanelProps) {
  const {
    loading,
    offers,
    proposedPrice,
    biddingActive,
    timeRemaining,
    increaseProposal,
    acceptCounterOffer,
    rejectCounterOffer
  } = useClientBidding({ bookingId, estimatedPrice });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIncreaseOffer = async () => {
    if (!proposedPrice) return;
    const newPrice = proposedPrice + 500; // +500 CDF
    await increaseProposal(newPrice);
  };

  const handleAcceptOffer = async (offerId: string, driverId: string) => {
    const success = await acceptCounterOffer(offerId, driverId);
    if (success) {
      onDriverAccepted(driverId);
    }
  };

  if (!biddingActive && offers.length === 0) {
    return (
      <Card className="p-6 text-center space-y-4">
        <div className="text-4xl">⏱️</div>
        <div>
          <h3 className="font-bold text-lg mb-2">Enchère terminée</h3>
          <p className="text-sm text-muted-foreground">
            Aucune offre reçue. Vous pouvez augmenter votre proposition ou accepter le prix Kwenda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleIncreaseOffer} disabled={loading} className="flex-1">
            Augmenter l'offre
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
      {/* Header - Status enchère */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">🎯 Enchère en cours</h3>
            <p className="text-xs text-muted-foreground">
              Votre offre : {proposedPrice?.toLocaleString()} CDF
            </p>
          </div>
          {biddingActive && (
            <Badge variant="default" className="px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {offers.length} {offers.length > 1 ? 'réponses' : 'réponse'}
            </span>
          </div>
          {proposedPrice && proposedPrice < estimatedPrice && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-semibold">
                -{((estimatedPrice - proposedPrice) / estimatedPrice * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Liste des offres */}
      {offers.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground px-1">
            Offres des chauffeurs
          </h4>
          {offers.map((offer) => (
            <motion.div
              key={offer.offerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{offer.driverName}</p>
                      {offer.driverRating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{offer.driverRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {offer.distanceToPickup && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{offer.distanceToPickup.toFixed(1)} km</span>
                        {offer.estimatedArrival && (
                          <span>• ~{offer.estimatedArrival} min</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      {offer.offeredPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">CDF</p>
                  </div>
                </div>

                {offer.isCounterOffer && (
                  <Badge variant="secondary" className="text-xs">
                    💰 Contre-offre
                  </Badge>
                )}

                {offer.message && (
                  <p className="text-xs text-muted-foreground italic">
                    "{offer.message}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptOffer(offer.offerId, offer.driverId)}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectCounterOffer(offer.offerId)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-sm text-muted-foreground">
            En attente des réponses des chauffeurs...
          </p>
        </Card>
      )}

      {/* Actions globales */}
      <Card className="p-4 space-y-2">
        <Button
          variant="outline"
          onClick={handleIncreaseOffer}
          disabled={loading || !proposedPrice}
          className="w-full"
        >
          📈 Augmenter mon offre (+500 CDF)
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="w-full text-muted-foreground"
        >
          Annuler la recherche
        </Button>
      </Card>
    </motion.div>
  );
}
