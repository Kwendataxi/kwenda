import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  return (
    <div className="relative w-full max-w-6xl mx-auto" style={{ contain: 'layout' }}>
      {/* Carrousel Container */}
      <div className="overflow-hidden rounded-2xl" ref={emblaRef} style={{ contain: 'layout style' }}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative"
            >
              {/* Glow effect réduit et optimisé */}
              <div className="absolute -inset-2 bg-gradient-radial from-primary/5 via-primary/3 to-transparent blur-2xl opacity-20"></div>
              
              {/* Image Container avec hauteur fixe responsive */}
              <div className="relative h-[340px] sm:h-[400px] md:h-[460px] overflow-hidden rounded-2xl">
                {/* Bordure néomorphique */}
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{ objectPosition: 'center 60%' }}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "low"}
                    decoding={index === 0 ? "sync" : "async"}
                    width={1280}
                    height={720}
                  />
                  
                  {/* Gradient Overlay subtil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  {/* Overlay progressif pour masquer badge NOUVEAU */}
                  <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-background via-background/90 to-transparent z-10"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Design modernisé */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-card/90 backdrop-blur-md hover:bg-white dark:hover:bg-card text-foreground p-3 rounded-full shadow-xl border border-white/40 dark:border-border/40 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Slide précédent"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
      </button>
      
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-card/90 backdrop-blur-md hover:bg-white dark:hover:bg-card text-foreground p-3 rounded-full shadow-xl border border-white/40 dark:border-border/40 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Slide suivant"
      >
        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Dots Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? 'w-10 bg-primary shadow-lg shadow-primary/50'
                : 'w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
