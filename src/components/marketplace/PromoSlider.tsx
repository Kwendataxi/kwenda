import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Promo {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  cta: string;
  action: string;
}

const promos: Promo[] = [
  {
    id: '1',
    title: '🎉 -30% sur l\'électronique',
    subtitle: 'Code: TECH30',
    gradient: 'from-blue-600 via-purple-600 to-pink-600',
    cta: 'Découvrir',
    action: 'electronics'
  },
  {
    id: '2',
    title: '🚀 Livraison gratuite',
    subtitle: 'Commandes +50 000 CDF',
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    cta: 'Commander',
    action: 'free_delivery'
  },
  {
    id: '3',
    title: '💎 Nouveaux vendeurs',
    subtitle: 'Produits exclusifs',
    gradient: 'from-orange-500 via-red-500 to-pink-600',
    cta: 'Explorer',
    action: 'new_vendors'
  }
];

interface PromoSliderProps {
  onPromoClick?: (action: string) => void;
  autoplayDelay?: number;
  className?: string;
}

export const PromoSlider = ({ 
  onPromoClick, 
  autoplayDelay = 5000,
  className 
}: PromoSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay logic avec pause au hover
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [isPaused, autoplayDelay]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % promos.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);

  const currentPromo = promos[currentIndex];

  return (
    <div 
      className={cn("relative overflow-hidden rounded-2xl", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className={cn(
            "relative h-36 md:h-44 rounded-2xl overflow-hidden",
            "bg-gradient-to-r",
            currentPromo.gradient
          )}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-4 md:px-6">
            <div className="flex-1 space-y-1 md:space-y-2">
              <motion.h3 
                className="text-lg md:text-2xl font-bold text-white drop-shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentPromo.title}
              </motion.h3>
              <motion.p 
                className="text-xs md:text-sm text-white/90 drop-shadow-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentPromo.subtitle}
              </motion.p>
            </div>
            
            {/* CTA Button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <Button
                onClick={() => onPromoClick?.(currentPromo.action)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/30 shadow-xl"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {currentPromo.cta}
              </Button>
            </motion.div>
          </div>

          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows - desktop only */}
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Dots indicator - compact */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "w-8 bg-white" 
                : "w-1.5 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
