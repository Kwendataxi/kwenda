import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

// Mêmes images que la landing page
import campaignClient from '@/assets/campaign-client.png';
import campaignDelivery from '@/assets/campaign-delivery.png';

interface PromoSliderProps {
  onServiceSelect?: (service: string) => void;
}

const slides = [
  {
    id: 1,
    image: campaignClient,
    alt: 'Kwenda - Simplifiez vos trajets, profitez de chaque instant',
  },
  {
    id: 2,
    image: campaignDelivery,
    alt: 'Devenez livreur Kwenda et gagnez plus rapidement',
  }
];

const AUTOPLAY_DURATION = 5000;

const PromoSliderOptimized = memo(({ onServiceSelect }: PromoSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const progressRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Précharger toutes les images au montage
  useEffect(() => {
    let loadedCount = 0;
    const totalImages = slides.length;

    slides.forEach((slide) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.src = slide.image;
    });

    // Fallback si les images sont déjà en cache
    setTimeout(() => setImagesLoaded(true), 100);
  }, []);

  // Fonction pour changer de slide avec haptics
  const goToSlide = useCallback(async (index: number) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics non disponible (web)
    }
    setCurrentIndex(index);
    setProgress(0);
    progressRef.current = 0;
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
    progressRef.current = 0;
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
    progressRef.current = 0;
  }, []);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      nextSlide();
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    },
    onSwipedRight: () => {
      prevSlide();
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  // Animation de progression fluide avec requestAnimationFrame
  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      progressRef.current += (deltaTime / AUTOPLAY_DURATION) * 100;

      if (progressRef.current >= 100) {
        nextSlide();
      } else {
        setProgress(progressRef.current);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, currentIndex, nextSlide]);

  // Index précédent pour le fallback
  const prevIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;

  return (
    <div className="w-full relative mb-6 mx-auto max-w-7xl z-10 px-3">
      <div 
        {...swipeHandlers}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
        className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl"
      >
        {/* Image de fond statique (évite le flash gris) */}
        <img
          src={slides[currentIndex].image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          aria-hidden="true"
        />

        {/* Transition crossfade fluide */}
        <AnimatePresence mode="sync">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.25, 
              ease: "easeInOut"
            }}
            className="absolute inset-0"
          >
            <img
              src={slides[currentIndex].image}
              alt={slides[currentIndex].alt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient léger pour les contrôles */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        {/* Barre de progression animée */}
        {slides.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
            <motion.div
              className="h-full bg-white/80"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
        )}

        {/* Dots animés avec spring */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 items-center">
            {slides.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Aller à la slide ${i + 1}`}
                layout
                initial={false}
                animate={{
                  width: i === currentIndex ? 20 : 6,
                  backgroundColor: i === currentIndex ? "rgb(255,255,255)" : "rgba(255,255,255,0.5)"
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25 
                }}
                className={cn(
                  "h-1.5 rounded-full",
                  i === currentIndex && "shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

PromoSliderOptimized.displayName = 'PromoSliderOptimized';

export { PromoSliderOptimized as PromoSlider };
