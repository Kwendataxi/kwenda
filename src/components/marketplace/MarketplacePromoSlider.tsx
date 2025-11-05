import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Promo {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  cta: string;
  action: string;
  icon?: React.ComponentType<any>;
}

const promos: Promo[] = [
  {
    id: '1',
    title: '🎉 -30% Électronique',
    subtitle: 'Code: TECH30',
    gradient: 'from-blue-600 via-purple-600 to-pink-600',
    cta: 'Voir',
    action: 'electronics'
  },
  {
    id: '2',
    title: '🚀 Livraison offerte',
    subtitle: 'Dès 50 000 CDF',
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    cta: 'Commander',
    action: 'free_delivery'
  },
  {
    id: '3',
    title: '💎 Nouveautés',
    subtitle: 'Produits exclusifs',
    gradient: 'from-orange-500 via-red-500 to-pink-600',
    cta: 'Explorer',
    action: 'new_vendors'
  },
  {
    id: '4',
    title: '🏪 Vendez avec nous',
    subtitle: 'Rejoignez la marketplace',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    cta: 'Démarrer →',
    action: 'become_vendor',
    icon: Store
  }
];

interface PromoSliderProps {
  onPromoClick?: (action: string) => void;
  onServiceSelect?: (service: string) => void;
  autoplayDelay?: number;
  className?: string;
}

export const PromoSlider = ({ 
  onPromoClick,
  onServiceSelect, 
  autoplayDelay = 5000,
  className 
}: PromoSliderProps) => {
  console.log('🎨 [PromoSlider] Rendu avec', promos.length, 'promos');
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
      className={cn("relative overflow-hidden rounded-2xl z-10", className)}
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
            "relative h-40 md:h-48 rounded-2xl overflow-hidden",
            "bg-gradient-to-r",
            currentPromo.gradient
          )}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-4 md:px-6">
            <div className="flex-1 space-y-2 md:space-y-3 max-w-[60%] md:max-w-[65%]">
              <motion.h3 
                className="text-xl md:text-3xl font-extrabold text-white drop-shadow-2xl tracking-tight line-clamp-1"
                initial={{ y: 30, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ 
                  delay: 0.15,
                  type: "spring",
                  stiffness: 150
                }}
              >
                {currentPromo.title}
              </motion.h3>
              <motion.p 
                className="text-sm md:text-base font-medium text-white/95 drop-shadow-lg line-clamp-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ 
                  delay: 0.25,
                  type: "spring",
                  stiffness: 100
                }}
              >
                {currentPromo.subtitle}
              </motion.p>
            </div>
            
            {/* CTA Button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="flex items-center gap-3"
            >
              {currentPromo.icon && (
                <currentPromo.icon className="h-10 w-10 text-white/80 hidden sm:block" />
              )}
              <Button
                onClick={() => {
                  console.log('🎯 Promo clicked:', currentPromo.action);
                  onPromoClick?.(currentPromo.action);
                  onServiceSelect?.(currentPromo.action === 'become_vendor' ? 'marketplace' : 'marketplace');
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/30 shadow-xl hover:scale-110 transition-all duration-300"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
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
