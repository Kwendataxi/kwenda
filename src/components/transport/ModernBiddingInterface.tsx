import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gavel, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  Users, 
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ModernBiddingInterfaceProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  basePrice: number;
  proposedPrice: number | null;
  onProposedPriceChange: (price: number) => void;
  driversNotified?: number;
  offersReceived?: number;
}

export default function ModernBiddingInterface({
  enabled,
  onEnabledChange,
  basePrice,
  proposedPrice,
  onProposedPriceChange,
  driversNotified = 0,
  offersReceived = 0
}: ModernBiddingInterfaceProps) {
  const currentPrice = proposedPrice ?? basePrice;
  const minPrice = Math.round(basePrice * 0.5);
  const maxPrice = Math.round(basePrice * 1.5);
  
  const savings = basePrice - currentPrice;
  const savingsPercent = Math.round((savings / basePrice) * 100);
  const isDiscount = savings > 0;

  // Marqueurs pour le slider
  const markers = [
    { value: minPrice, label: 'Min' },
    { value: basePrice, label: 'Kwenda' },
    { value: maxPrice, label: 'Max' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-3xl overflow-hidden transition-all duration-500",
        enabled
          ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-yellow-950/40 border-2 border-amber-300/50 dark:border-amber-700/50 shadow-lg shadow-amber-500/10"
          : "bg-muted/30 border border-border/50"
      )}
    >
      {/* Header avec toggle */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ 
              rotate: enabled ? [0, -10, 10, 0] : 0,
              scale: enabled ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 0.5 }}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
              enabled 
                ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30" 
                : "bg-muted"
            )}
          >
            <Gavel className={cn(
              "w-6 h-6 transition-colors",
              enabled ? "text-white" : "text-muted-foreground"
            )} />
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2">
              <p className={cn(
                "font-bold text-base transition-colors",
                enabled ? "text-amber-700 dark:text-amber-400" : "text-foreground"
              )}>
                Négociez le prix
              </p>
              {enabled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 font-bold border-0">
                    <Zap className="w-2.5 h-2.5 mr-0.5" />
                    ACTIF
                  </Badge>
                </motion.div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {enabled 
                ? "Les chauffeurs voient votre offre" 
                : "Proposez votre prix aux chauffeurs"}
            </p>
          </div>
        </div>

        <Switch
          checked={enabled}
          onCheckedChange={(checked) => {
            onEnabledChange(checked);
            if (checked && !proposedPrice) {
              onProposedPriceChange(basePrice);
            }
          }}
          className={cn(
            "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500",
            "scale-110"
          )}
        />
      </div>

      {/* Contenu du bidding */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 pb-5 space-y-5">
              {/* Carte de prix principale */}
              <div className="bg-white/80 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 shadow-inner">
                {/* Votre offre */}
                <div className="text-center mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Votre offre</p>
                  <motion.p 
                    key={currentPrice}
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black text-amber-600 dark:text-amber-400"
                  >
                    {currentPrice.toLocaleString()}
                    <span className="text-lg font-semibold ml-1">CDF</span>
                  </motion.p>
                  
                  {/* Indicateur d'économie */}
                  <AnimatePresence mode="wait">
                    {savings !== 0 && (
                      <motion.div
                        key={savings}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -5, opacity: 0 }}
                        className={cn(
                          "inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold",
                          isDiscount
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                        )}
                      >
                        {isDiscount ? (
                          <>
                            <TrendingDown className="w-3.5 h-3.5" />
                            -{Math.abs(savingsPercent)}% • Économie de {Math.abs(savings).toLocaleString()} CDF
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{Math.abs(savingsPercent)}% • Offre généreuse
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Slider premium */}
                <div className="space-y-3">
                  <div className="relative pt-2 pb-6">
                    <Slider
                      value={[currentPrice]}
                      onValueChange={([value]) => onProposedPriceChange(value)}
                      min={minPrice}
                      max={maxPrice}
                      step={500}
                      className={cn(
                        "[&_[role=slider]]:h-6 [&_[role=slider]]:w-6",
                        "[&_[role=slider]]:bg-gradient-to-br [&_[role=slider]]:from-amber-500 [&_[role=slider]]:to-orange-500",
                        "[&_[role=slider]]:border-3 [&_[role=slider]]:border-white",
                        "[&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-amber-500/40",
                        "[&_.range]:bg-gradient-to-r [&_.range]:from-amber-400 [&_.range]:to-orange-500",
                        "[&_.track]:h-3 [&_.track]:bg-amber-100 dark:[&_.track]:bg-amber-900/30"
                      )}
                    />
                    
                    {/* Marqueurs sous le slider */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                      {markers.map((marker) => (
                        <div 
                          key={marker.label}
                          className="flex flex-col items-center"
                        >
                          <div 
                            className={cn(
                              "w-1.5 h-1.5 rounded-full mb-1",
                              marker.label === 'Kwenda' 
                                ? "bg-primary" 
                                : "bg-muted-foreground/40"
                            )} 
                          />
                          <span className={cn(
                            "text-[10px]",
                            marker.label === 'Kwenda'
                              ? "font-bold text-primary"
                              : "text-muted-foreground"
                          )}>
                            {marker.label === 'Kwenda' 
                              ? `${marker.value.toLocaleString()}`
                              : marker.value.toLocaleString()
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comparaison visuelle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl mt-2">
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">Prix Kwenda</p>
                    <p className="font-bold text-foreground">{basePrice.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">Votre offre</p>
                    <p className="font-bold text-amber-600 dark:text-amber-400">{currentPrice.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">Économie</p>
                    <p className={cn(
                      "font-bold",
                      isDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                    )}>
                      {isDiscount ? `-${Math.abs(savingsPercent)}%` : `+${Math.abs(savingsPercent)}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats en temps réel */}
              {(driversNotified > 0 || offersReceived > 0) && (
                <div className="flex gap-3">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 bg-white/60 dark:bg-black/20 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{driversNotified}</p>
                      <p className="text-xs text-muted-foreground">Chauffeurs notifiés</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 bg-white/60 dark:bg-black/20 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{offersReceived}</p>
                      <p className="text-xs text-muted-foreground">Offres reçues</p>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Tip */}
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Les chauffeurs à proximité recevront votre demande. Plus votre offre est attractive, plus vite vous serez pris en charge.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
