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
                  'relative h-48 rounded-3xl overflow-hidden shadow-xl cursor-pointer group',
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
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-black mb-2 drop-shadow-lg tracking-tight">
                    {promo.title}
                  </h3>
                  <p className="text-sm font-medium opacity-95 mb-4 drop-shadow leading-relaxed max-w-[85%]">
                    {promo.description}
                  </p>
                  
                  {/* CTA Button - more prominent */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/20 backdrop-blur-md rounded-xl w-fit shadow-lg border border-white/30 group-hover:bg-white/30 group-hover:shadow-xl transition-all duration-300">
                    <span className="text-sm font-bold">{promo.cta}</span>
                    <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-10 left-10 w-16 h-16 bg-white/5 rounded-full blur-xl" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Pagination dots - more visible */}
        <div className="flex justify-center gap-2 mt-5">
          {defaultPromos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300 shadow-md',
                current === index
                  ? 'w-8 bg-primary scale-110 shadow-lg'
                  : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
