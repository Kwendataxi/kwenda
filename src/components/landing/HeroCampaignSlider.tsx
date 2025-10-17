import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

// Images des campagnes publicitaires
import campaignClient from '@/assets/campaign-client.png';
import campaignDelivery from '@/assets/campaign-delivery.png';

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

export const HeroCampaignSlider = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'center',
      skipSnaps: false,
      duration: 30,
    },
    [Autoplay({ 
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scrollPrev, scrollNext]);

  // Touch gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: scrollNext,
    onSwipedRight: scrollPrev,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div className="relative w-full max-w-6xl mx-auto" {...swipeHandlers}>
      {/* Carrousel Container */}
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative group"
              initial={{ opacity: 0.8, scale: 0.98 }}
              animate={{ 
                opacity: selectedIndex === index ? 1 : 0.8,
                scale: selectedIndex === index ? 1 : 0.98 
              }}
              transition={{ duration: 0.4 }}
            >
              {/* Glow effect */}
              <motion.div 
                className="absolute -inset-4 bg-gradient-radial from-primary/20 via-red-500/10 to-transparent blur-3xl"
                animate={{ 
                  opacity: selectedIndex === index ? 0.8 : 0.4 
                }}
              />
              
              {/* Image avec aspect ratio 16:9 pour format paysage */}
              <div className="relative rounded-xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] transition-all duration-500 group">
                <div className="relative aspect-[16/9] w-full bg-background/5 overflow-hidden">
                  <motion.img
                    src={slide.image}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{ opacity: 0, transition: 'opacity 0.5s' }}
                  />
                  
                  {/* Interactive Overlay on Hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                      <motion.h3 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        className="text-2xl sm:text-3xl font-bold mb-2"
                      >
                        {slide.alt.split('-')[0].trim()}
                      </motion.h3>
                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm sm:text-base mb-4 opacity-90"
                      >
                        {slide.alt.split('-')[1]?.trim() || ''}
                      </motion.p>
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(239,68,68,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-primary rounded-full font-bold text-sm sm:text-base hover:bg-primary/90 transition-colors"
                      >
                        En savoir plus →
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows with Magnetic Effect */}
      <motion.div
        whileHover={{ 
          scale: 1.1,
          x: -5,
        }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all z-10 shadow-lg border-border/60"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Slide précédent"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ 
          scale: 1.1,
          x: 5,
        }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all z-10 shadow-lg border-border/60"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Slide suivant"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </motion.div>

      {/* Dots Indicators Enhanced */}
      <div className="flex justify-center gap-3 mt-6">
        {slides.map((_, index) => (
          <motion.button
            key={index}
            className={`relative h-3 rounded-full overflow-hidden transition-all duration-300 ${
              index === selectedIndex ? 'w-12' : 'w-3'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Aller au slide ${index + 1}`}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-muted-foreground/30" />
            
            {/* Progress bar active */}
            {index === selectedIndex && (
              <motion.div
                className="absolute inset-0 bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                key={`progress-${selectedIndex}`}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
