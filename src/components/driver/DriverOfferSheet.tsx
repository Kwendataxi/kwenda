import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDriverOffer } from '@/hooks/useDriverOffer';
import { MapPin, Clock, DollarSign, Users, TrendingDown, TrendingUp, Zap, Navigation, Minus, Plus } from 'lucide-react';
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
  distanceToPickup?: number;
}

export const DriverOfferSheet = ({
  open,
  onOpenChange,
  bookingId,
  estimatedPrice,
  distance,
  pickupAddress,
  destinationAddress,
  offerCount = 0,
  distanceToPickup = 0
}: DriverOfferSheetProps) => {
  const { submitOffer, submitting } = useDriverOffer();
  const [offeredPrice, setOfferedPrice] = useState(estimatedPrice);
  const [message, setMessage] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState(Math.ceil(distanceToPickup * 2.5)); // 2.5 min/km

  // Limites de prix (50% à 150% du tarif estimé)
  const minPrice = Math.floor(estimatedPrice * 0.5);
  const maxPrice = Math.ceil(estimatedPrice * 1.5);

  // Calcul du gain net (après commission de 10%)
  const commission = offeredPrice * 0.1;
  const netEarning = offeredPrice - commission;

  // Différence avec le tarif estimé
  const priceDifference = offeredPrice - estimatedPrice;
  const isCompetitive = priceDifference <= 0;
  const discountPercent = Math.abs(Math.round((priceDifference / estimatedPrice) * 100));

  // Quick price suggestions
  const quickPrices = [
    { label: '-10%', value: Math.floor(estimatedPrice * 0.9), icon: TrendingDown },
    { label: 'Kwenda', value: estimatedPrice, icon: Zap },
    { label: '+10%', value: Math.ceil(estimatedPrice * 1.1), icon: TrendingUp },
  ];

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
      setOfferedPrice(estimatedPrice);
      setMessage('');
    }
  };

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setOfferedPrice(estimatedPrice);
      setMessage('');
      setEstimatedArrival(Math.ceil(distanceToPickup * 2.5));
    }
  }, [open, estimatedPrice, distanceToPickup]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Faire une offre
            </SheetTitle>
            {offerCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10">
                <Users className="h-3 w-3 mr-1" />
                {offerCount} concurrent{offerCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto max-h-[calc(90vh-200px)] py-4">
          {/* Route summary - compact */}
          <div className="bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium truncate">{pickupAddress}</p>
                <p className="text-sm font-medium truncate">{destinationAddress}</p>
              </div>
            </div>
            
            {/* Stats row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {distance.toFixed(1)} km
              </span>
              <span className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {distanceToPickup.toFixed(1)} km de vous
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{estimatedArrival} min
              </span>
            </div>
          </div>

          {/* Quick price suggestions */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Suggestions rapides</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickPrices.map((preset) => {
                const Icon = preset.icon;
                const isSelected = offeredPrice === preset.value;
                return (
                  <motion.button
                    key={preset.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOfferedPrice(preset.value)}
                    className={`
                      p-3 rounded-xl border-2 transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/50 bg-muted/30 hover:border-border'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 mx-auto mb-1 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className={`text-xs font-medium ${isSelected ? 'text-primary' : ''}`}>
                      {preset.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {preset.value.toLocaleString()}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Price input with +/- buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Votre prix</Label>
              <Badge 
                variant={isCompetitive ? 'default' : 'secondary'}
                className={isCompetitive ? 'bg-emerald-500' : 'bg-amber-500/20 text-amber-600'}
              >
                {isCompetitive ? (
                  <><TrendingDown className="h-3 w-3 mr-1" /> -{discountPercent}%</>
                ) : (
                  <><TrendingUp className="h-3 w-3 mr-1" /> +{discountPercent}%</>
                )}
              </Badge>
            </div>

            {/* Modern +/- buttons with editable input */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setOfferedPrice(prev => Math.max(prev - 1000, minPrice))}
                disabled={offeredPrice <= minPrice}
                className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 border-2 border-border/50"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="relative">
                <input
                  type="number"
                  value={offeredPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) setOfferedPrice(Math.max(minPrice, Math.min(maxPrice, val)));
                  }}
                  className="w-36 h-16 text-center text-3xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                  CDF
                </span>
              </div>

              <button
                onClick={() => setOfferedPrice(prev => Math.min(prev + 1000, maxPrice))}
                disabled={offeredPrice >= maxPrice}
                className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 border-2 border-border/50"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Price range indicator */}
            <div className="flex justify-between text-xs text-muted-foreground px-2 pt-2">
              <span>{minPrice.toLocaleString()}</span>
              <span className="text-primary font-medium">{estimatedPrice.toLocaleString()} (Kwenda)</span>
              <span>{maxPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Net earning card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Votre gain net</p>
                <p className="text-xs text-muted-foreground">(après 10% commission)</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {netEarning.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">CDF</p>
              </div>
            </div>
          </motion.div>

          {/* Estimated arrival */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Temps d'arrivée estimé</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEstimatedArrival(Math.max(1, estimatedArrival - 1))}
                className="h-10 w-10 p-0"
              >
                -
              </Button>
              <div className="flex-1 bg-muted/30 rounded-xl px-4 py-2 text-center">
                <span className="text-2xl font-bold">{estimatedArrival}</span>
                <span className="text-sm text-muted-foreground ml-1">min</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEstimatedArrival(Math.min(60, estimatedArrival + 1))}
                className="h-10 w-10 p-0"
              >
                +
              </Button>
            </div>
          </div>

          {/* Message optionnel */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Message (optionnel)</Label>
            <Textarea
              placeholder="Ex: J'arrive dans 2 minutes..."
              maxLength={100}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none bg-muted/30 border-0 rounded-xl"
              rows={2}
            />
          </div>
        </div>

        {/* Submit button - sticky */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <Button
            onClick={handleSubmit}
            disabled={submitting || offeredPrice < minPrice || offeredPrice > maxPrice}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 shadow-lg shadow-amber-500/25"
            size="lg"
          >
            {submitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
              />
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
