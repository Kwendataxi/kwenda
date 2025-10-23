import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-radial from-primary/20 via-red-500/10 to-transparent blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              
              {/* Image avec aspect ratio 16:9 pour format paysage */}
              <div className="relative rounded-xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] hover:shadow-[0_30px_60px_-10px_rgba(239,68,68,0.4)] transition-all duration-500 group">
                <div className="relative aspect-[16/9] w-full bg-background/5">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={index <= 1 ? "eager" : "lazy"}
                    fetchPriority={index <= 1 ? "high" : undefined}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all z-10 shadow-lg border-border/60"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Slide précédent"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all z-10 shadow-lg border-border/60"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Slide suivant"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      {/* Dots Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? 'w-8 bg-primary'
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
