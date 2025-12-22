import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  illustration: string;
}

const promoSlides: PromoSlide[] = [
  {
    id: 'welcome',
    title: 'Livraison gratuite',
    subtitle: 'sur votre 1ère commande',
    cta: 'Commander',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    accentColor: 'bg-emerald-600 hover:bg-emerald-700',
    illustration: '🍽️',
  },
  {
    id: 'fast',
    title: 'Livraison express',
    subtitle: 'En moins de 30 minutes',
    cta: 'Découvrir',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-900 dark:text-amber-100',
    accentColor: 'bg-amber-600 hover:bg-amber-700',
    illustration: '🚀',
  },
  {
    id: 'discount',
    title: '-20% cette semaine',
    subtitle: 'Sur les restaurants partenaires',
    cta: 'Profiter',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-900 dark:text-rose-100',
    accentColor: 'bg-rose-600 hover:bg-rose-700',
    illustration: '🎉',
  },
  {
    id: 'rewards',
    title: 'Programme fidélité',
    subtitle: 'Gagnez des points à chaque commande',
    cta: 'S\'inscrire',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    textColor: 'text-violet-900 dark:text-violet-100',
    accentColor: 'bg-violet-600 hover:bg-violet-700',
    illustration: '⭐',
  }
];

export const ModernFoodPromoBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = promoSlides[currentSlide];

  return (
    <div className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "relative p-6 min-h-[140px] flex items-center justify-between",
              slide.bgColor
            )}
          >
            {/* Content */}
            <div className="flex-1 space-y-3 z-10">
              <div>
                <h3 className={cn("text-xl font-bold", slide.textColor)}>
                  {slide.title}
                </h3>
                <p className={cn("text-sm opacity-80 mt-0.5", slide.textColor)}>
                  {slide.subtitle}
                </p>
              </div>

              <Button 
                size="sm"
                className={cn(
                  "text-white font-medium rounded-full px-5",
                  slide.accentColor
                )}
              >
                {slide.cta}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Illustration */}
            <div className="text-6xl opacity-80 select-none">
              {slide.illustration}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {promoSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "w-6 bg-foreground/60"
                  : "w-1.5 bg-foreground/20 hover:bg-foreground/30"
              )}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
