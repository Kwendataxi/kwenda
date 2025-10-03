import { useEffect, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { defaultPromos } from '@/data/promos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PromoSliderProps {
  onServiceSelect: (service: string) => void;
}

export const PromoSlider = ({ onServiceSelect }: PromoSliderProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handlePromoClick = (promo: typeof defaultPromos[0]) => {
    // Gestion code promo BIENVENUE30
    if (promo.id === '1') {
      localStorage.setItem('activePromoCode', 'BIENVENUE30');
      localStorage.setItem('promoDiscount', '30');
      toast.success('Code promo BIENVENUE30 appliqué automatiquement!');
    }

    // Redirection vers le service
    if (promo.service) {
      onServiceSelect(promo.service);
    }
  };

  return (
    <div className="w-full px-4 pt-4">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {defaultPromos.map((promo) => (
            <CarouselItem key={promo.id} className="pl-2 md:pl-4">
              <div
                className={cn(
                  'relative h-40 sm:h-48 rounded-2xl overflow-hidden shadow-xl',
                  'bg-gradient-to-br',
                  promo.gradient
                )}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 text-white">
                  <h3 className="text-lg sm:text-xl font-bold mb-1 drop-shadow-lg">
                    {promo.title}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-95 mb-3 drop-shadow">
                    {promo.description}
                  </p>
                  <button 
                    onClick={() => handlePromoClick(promo)}
                    className="px-4 py-2 bg-white/95 hover:bg-white text-gray-900 rounded-lg font-semibold text-xs sm:text-sm w-fit transition-all hover:scale-105 shadow-lg"
                  >
                    {promo.cta}
                  </button>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-10 left-10 w-16 h-16 bg-white/5 rounded-full blur-xl" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {defaultPromos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                current === index
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
