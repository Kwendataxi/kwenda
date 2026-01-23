import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Truck, Sparkles, Clock, Gift, ChevronRight } from 'lucide-react';

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  Icon: React.ElementType;
}

const promoSlides: PromoSlide[] = [
  {
    id: 'delivery',
    title: 'Livraison gratuite',
    subtitle: 'Sur votre première commande',
    cta: 'Commander',
    bgClass: 'from-emerald-50 to-emerald-100/60 dark:from-emerald-950/30 dark:to-emerald-900/20',
    textClass: 'text-emerald-800 dark:text-emerald-200',
    accentClass: 'bg-emerald-600 hover:bg-emerald-700',
    Icon: Truck,
  },
  {
    id: 'new',
    title: 'Nouveaux restos',
    subtitle: 'Découvrez les dernières adresses',
    cta: 'Explorer',
    bgClass: 'from-violet-50 to-violet-100/60 dark:from-violet-950/30 dark:to-violet-900/20',
    textClass: 'text-violet-800 dark:text-violet-200',
    accentClass: 'bg-violet-600 hover:bg-violet-700',
    Icon: Sparkles,
  },
  {
    id: 'express',
    title: 'Livraison express',
    subtitle: 'En 20 min chrono',
    cta: 'Voir',
    bgClass: 'from-amber-50 to-amber-100/60 dark:from-amber-950/30 dark:to-amber-900/20',
    textClass: 'text-amber-800 dark:text-amber-200',
    accentClass: 'bg-amber-600 hover:bg-amber-700',
    Icon: Clock,
  },
  {
    id: 'promo',
    title: '-30% ce weekend',
    subtitle: 'Sur les plats sélectionnés',
    cta: 'Profiter',
    bgClass: 'from-rose-50 to-rose-100/60 dark:from-rose-950/30 dark:to-rose-900/20',
    textClass: 'text-rose-800 dark:text-rose-200',
    accentClass: 'bg-rose-600 hover:bg-rose-700',
    Icon: Gift,
  },
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
  const IconComponent = slide.Icon;

  return (
    <div className="px-4 pt-2">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${slide.bgClass} transition-colors duration-500`}>
        {/* Pattern subtil */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '16px 16px'
          }}
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center justify-between p-4 min-h-[100px]"
          >
            {/* Contenu texte */}
            <div className="flex-1 pr-4">
              <h3 className={`text-lg font-bold ${slide.textClass} mb-0.5`}>
                {slide.title}
              </h3>
              <p className={`text-sm ${slide.textClass} opacity-70 mb-3`}>
                {slide.subtitle}
              </p>
              <Button 
                size="sm"
                className={`${slide.accentClass} text-white text-xs h-8 px-4 rounded-full shadow-sm transition-transform active:scale-95`}
              >
                {slide.cta}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {/* Icône illustration */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`flex-shrink-0 w-16 h-16 rounded-2xl ${slide.accentClass} bg-opacity-10 flex items-center justify-center`}
            >
              <IconComponent className={`w-8 h-8 ${slide.textClass}`} />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Indicateurs de pagination */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {promoSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-4 bg-foreground/40' 
                  : 'w-1 bg-foreground/15 hover:bg-foreground/25'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
