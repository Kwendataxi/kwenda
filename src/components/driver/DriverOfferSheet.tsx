import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useDriverOffer } from '@/hooks/useDriverOffer';
import { MapPin, Clock, DollarSign, Users, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface DriverOfferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  estimatedPrice: number;
  distance: number;
  pickupAddress: string;
  destinationAddress: string;
  offerCount?: number;
}

export const DriverOfferSheet = ({
  open,
  onOpenChange,
  bookingId,
  estimatedPrice,
  distance,
  pickupAddress,
  destinationAddress,
  offerCount = 0
}: DriverOfferSheetProps) => {
  const { submitOffer, submitting } = useDriverOffer();
  const [offeredPrice, setOfferedPrice] = useState(estimatedPrice);
  const [message, setMessage] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState(Math.ceil(distance * 3)); // 3 min/km

  // Limites de prix (50% à 150% du tarif estimé)
  const minPrice = Math.floor(estimatedPrice * 0.5);
  const maxPrice = Math.ceil(estimatedPrice * 1.5);

  // Calcul du gain net (après commission de 10%)
  const commission = offeredPrice * 0.1;
  const netEarning = offeredPrice - commission;

  // Différence avec le tarif estimé
  const priceDifference = offeredPrice - estimatedPrice;
  const isCompetitive = priceDifference <= 0;

  const handleSubmit = async () => {
    if (offeredPrice < minPrice || offeredPrice > maxPrice) {
      return;
    }

    const success = await submitOffer({
      bookingId,
      offeredPrice,
      originalEstimatedPrice: estimatedPrice,
      message: message.trim() || undefined,
      estimatedArrival
    });

    if (success) {
      onOpenChange(false);
      // Reset form
      setOfferedPrice(estimatedPrice);
      setMessage('');
    }
  };

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setOfferedPrice(estimatedPrice);
      setMessage('');
      setEstimatedArrival(Math.ceil(distance * 3));
    }
  }, [open, estimatedPrice, distance]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[75vh]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">Faire une offre 💰</SheetTitle>
          <SheetDescription className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            {distance.toFixed(1)} km • Tarif estimé: {estimatedPrice.toLocaleString()} CDF
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-180px)] pb-4">
          {/* Compteur de compétition */}
          {offerCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge variant="outline" className="w-full justify-center py-3 text-base">
                <Users className="h-4 w-4 mr-2" />
                {offerCount} autre{offerCount > 1 ? 's' : ''} chauffeur{offerCount > 1 ? 's' : ''} en compétition
              </Badge>
            </motion.div>
          )}

          {/* Itinéraire */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Départ</p>
                <p className="font-medium text-sm truncate">{pickupAddress}</p>
              </div>
            </div>
            <div className="ml-1 border-l-2 border-dashed border-muted-foreground/30 h-4" />
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Arrivée</p>
                <p className="font-medium text-sm truncate">{destinationAddress}</p>
              </div>
            </div>
          </div>

          {/* Prix proposé avec slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Votre prix proposé</Label>
              {isCompetitive ? (
                <Badge variant="default" className="bg-green-500">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Compétitif
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Plus cher
                </Badge>
              )}
            </div>

            {/* Input prix */}
            <div className="relative">
              <Input
                type="number"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(Number(e.target.value))}
                min={minPrice}
                max={maxPrice}
                step={100}
                className="text-3xl font-bold h-16 pr-16 text-center"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                CDF
              </span>
            </div>

            {/* Slider pour ajustement rapide */}
            <Slider
              min={minPrice}
              max={maxPrice}
              step={100}
              value={[offeredPrice]}
              onValueChange={([val]) => setOfferedPrice(val)}
              className="py-4"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Min: {minPrice.toLocaleString()}</span>
              <span>Max: {maxPrice.toLocaleString()}</span>
            </div>

            {/* Calcul gain */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Prix offert</span>
                <span className="font-semibold">{offeredPrice.toLocaleString()} CDF</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Commission (10%)</span>
                <span className="text-sm text-destructive">-{commission.toLocaleString()} CDF</span>
              </div>
              <div className="border-t border-primary/20 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Votre gain</span>
                  <span className="text-2xl font-bold text-primary">
                    {netEarning.toLocaleString()} CDF
                  </span>
                </div>
              </div>
            </div>

            {/* Différence avec estimation */}
            {priceDifference !== 0 && (
              <p className={`text-sm text-center ${
                priceDifference > 0 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {priceDifference > 0 ? '+' : ''}
                {priceDifference.toLocaleString()} CDF par rapport au tarif estimé
              </p>
            )}
          </div>

          {/* Temps d'arrivée estimé */}
          <div className="space-y-2">
            <Label className="text-sm">Temps d'arrivée estimé (optionnel)</Label>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(Number(e.target.value))}
                min={1}
                max={60}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          {/* Message optionnel */}
          <div className="space-y-2">
            <Label className="text-sm">Message au client (optionnel)</Label>
            <Textarea
              placeholder="Ex: Je suis à 2 minutes de vous !"
              maxLength={100}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/100 caractères
            </p>
          </div>
        </div>

        {/* Bouton validation fixe en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          <Button
            onClick={handleSubmit}
            disabled={submitting || offeredPrice < minPrice || offeredPrice > maxPrice}
            className="w-full h-14 text-lg font-bold"
            size="lg"
          >
            {submitting ? (
              'Envoi en cours...'
            ) : (
              <>
                <DollarSign className="h-5 w-5 mr-2" />
                Envoyer l'offre
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
