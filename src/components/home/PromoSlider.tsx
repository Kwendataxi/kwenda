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
    <div className="w-full px-4 pt-2">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {defaultPromos.map((promo) => (
            <CarouselItem key={promo.id} className="pl-2 md:pl-4">
              <div
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-28 rounded-2xl overflow-hidden shadow-lg cursor-pointer group',
                  'bg-gradient-to-br',
                  promo.gradient,
                  'transition-transform duration-300 hover:scale-[1.02]'
                )}
              >
                {/* Gradient overlay with parallax */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:scale-110 transition-transform duration-700" />
                
                {/* Overlay pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)] opacity-60" />
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                  <h3 className="text-lg font-black mb-1 drop-shadow-lg tracking-tight">
                    {promo.title}
                  </h3>
                  <p className="text-xs font-medium opacity-90 mb-2 drop-shadow leading-snug max-w-[85%] line-clamp-1">
                    {promo.description}
                  </p>
                  
                  {/* CTA Button - compact */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg w-fit shadow-md border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                    <span className="text-xs font-bold">{promo.cta}</span>
                    <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* Decorative circles - reduced */}
                <div className="absolute top-2 right-2 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                <div className="absolute bottom-4 left-6 w-10 h-10 bg-white/5 rounded-full blur-lg" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Pagination dots - compact */}
        <div className="flex justify-center gap-1.5 mt-3">
          {defaultPromos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                current === index
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
