import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Store, Zap, Gift, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Promo {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  cta: string;
  action: string;
  emoji: string;
  bgImage?: string;
}

const promos: Promo[] = [
  {
    id: '1',
    title: '-30% Électronique',
    subtitle: 'Code: TECH30 • Valide 48h',
    gradient: 'from-orange-600 via-amber-500 to-yellow-500',
    cta: 'En profiter',
    action: 'electronics',
    emoji: '📱',
    bgImage: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80'
  },
  {
    id: '2',
    title: 'Livraison GRATUITE',
    subtitle: 'Dès 50 000 CDF d\'achat',
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    cta: 'Commander',
    action: 'free_delivery',
    emoji: '🚚',
    bgImage: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80'
  },
  {
    id: '3',
    title: 'Nouveautés Mode',
    subtitle: 'Collection exclusive 2024',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    cta: 'Découvrir',
    action: 'fashion',
    emoji: '👗',
    bgImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'
  },
  {
    id: '4',
    title: 'Devenez Vendeur',
    subtitle: 'Rejoignez +500 marchands',
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    cta: 'Démarrer →',
    action: 'become_vendor',
    emoji: '🏪',
    bgImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Autoplay avec progress bar
  useEffect(() => {
    if (isPaused) return;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentIndex(curr => (curr + 1) % promos.length);
          return 0;
        }
        return prev + (100 / (autoplayDelay / 50));
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [isPaused, autoplayDelay, currentIndex]);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % promos.length);
    setProgress(0);
  };
  
  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);
    setProgress(0);
  };

  const currentPromo = promos[currentIndex];

  return (
    <div 
      className={cn("relative overflow-hidden rounded-3xl z-10 shadow-2xl", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative h-44 md:h-52 rounded-3xl overflow-hidden"
        >
          {/* Background Image avec overlay */}
          {currentPromo.bgImage && (
            <div className="absolute inset-0">
              <img 
                src={currentPromo.bgImage} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-90",
                currentPromo.gradient
              )} />
            </div>
          )}
          
          {/* Fallback gradient si pas d'image */}
          {!currentPromo.bgImage && (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r",
              currentPromo.gradient
            )} />
          )}
          
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 backdrop-blur-[1px]" />
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: '110%' 
                }}
                animate={{ 
                  y: '-10%',
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-5 md:px-8">
            <div className="flex-1 space-y-2 md:space-y-3 max-w-[55%] md:max-w-[60%]">
              {/* Emoji animé */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-4xl md:text-5xl drop-shadow-2xl"
              >
                {currentPromo.emoji}
              </motion.div>
              
              <motion.h3 
                className="text-xl md:text-3xl font-black text-white drop-shadow-2xl tracking-tight"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 150 }}
              >
                {currentPromo.title}
              </motion.h3>
              
              <motion.p 
                className="text-sm md:text-base font-semibold text-white/95 drop-shadow-lg"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 100 }}
              >
                {currentPromo.subtitle}
              </motion.p>
            </div>
            
            {/* CTA Button Premium */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <Button
                onClick={() => {
                  onPromoClick?.(currentPromo.action);
                  onServiceSelect?.('marketplace');
                }}
                className="bg-white hover:bg-white/90 text-gray-900 font-bold shadow-2xl hover:shadow-white/30 hover:scale-110 transition-all duration-300 px-5 py-2.5 rounded-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2 text-orange-500" />
                {currentPromo.cta}
              </Button>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows - desktop */}
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar & Dots - Apple style */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setProgress(0);
            }}
            className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
            style={{ width: index === currentIndex ? '32px' : '8px' }}
            aria-label={`Slide ${index + 1}`}
          >
            <div className="absolute inset-0 bg-white/40" />
            {index === currentIndex && (
              <motion.div 
                className="absolute inset-0 bg-white rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
