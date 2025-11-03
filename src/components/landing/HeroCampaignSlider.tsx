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
              {/* Glow effect réduit */}
              <div className="absolute -inset-4 bg-gradient-radial from-primary/10 via-red-500/5 to-transparent blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
              
              {/* Image avec aspect ratio 16:9 pour format paysage */}
              <div className="relative rounded-xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] border-2 border-border/30 bg-card/20 backdrop-blur-sm transition-all duration-500 group">
                <div className="relative aspect-[16/9] w-full bg-background/5">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "low"}
                    decoding={index === 0 ? "sync" : "async"}
                    width={1280}
                    height={720}
                  />
                  {/* Masque OPAQUE pour badge NOUVEAU */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-background pointer-events-none z-20"></div>
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
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white hover:bg-white/90 hover:scale-110 transition-all z-20 shadow-xl border-2 border-border/50"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Slide précédent"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white hover:bg-white/90 hover:scale-110 transition-all z-20 shadow-xl border-2 border-border/50"
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
