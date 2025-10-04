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
    <div className="w-full px-4">
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
                  'relative h-48 rounded-3xl overflow-hidden cursor-pointer group',
                  'bg-gradient-to-br shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
                  promo.gradient,
                  'transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] hover:scale-[1.02]'
                )}
              >
                {/* Overlay gradients sophistiqués */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
                
                {/* Slide 1: 30% Discount */}
                {promo.id === '1' && (
                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                    {/* Badge promo animé */}
                    <div className="self-end">
                      <div className="bg-yellow-400 text-black px-4 py-1.5 rounded-full font-black text-xs shadow-xl rotate-3 animate-pulse">
                        {promo.description}
                      </div>
                    </div>

                    {/* Titre principal */}
                    <div>
                      <h3 className="text-4xl font-black drop-shadow-2xl leading-none mb-2 -rotate-1">
                        30% OFF
                      </h3>
                      <p className="text-base font-bold opacity-95 drop-shadow-lg mb-4">
                        sur ta 1ère course 🎉
                      </p>
                      
                      {/* CTA Button */}
                      <div className="inline-block bg-white text-primary px-6 py-3 rounded-2xl font-black text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Déco circles */}
                    <div className="absolute bottom-8 right-8 w-24 h-24 bg-white/20 rounded-full blur-3xl" />
                  </div>
                )}

                {/* Slide 2: Free Delivery */}
                {promo.id === '2' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
                    <div className="mb-3 text-5xl">📦</div>
                    <h3 className="text-2xl font-extrabold drop-shadow-2xl mb-2">
                      {promo.title}
                    </h3>
                    <p className="text-sm font-bold opacity-90 drop-shadow-lg mb-4 max-w-[85%]">
                      {promo.description}
                    </p>
                    
                    <div className="px-7 py-3 bg-white/95 text-yellow-600 rounded-full font-black text-sm shadow-xl hover:scale-105 hover:bg-white transition-all duration-200 backdrop-blur-sm">
                      {promo.cta} →
                    </div>

                    {/* Déco elements */}
                    <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                  </div>
                )}

                {/* Slide 3: Lottery */}
                {promo.id === '3' && (
                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                    {/* Background text */}
                    <div className="absolute top-1/2 right-6 -translate-y-1/2 text-white/10 font-black text-7xl leading-none select-none">
                      100K
                    </div>

                    {/* Confettis */}
                    <div className="absolute top-4 left-8 text-3xl opacity-90">🎉</div>
                    <div className="absolute top-10 right-14 text-2xl opacity-80">✨</div>
                    <div className="absolute bottom-8 left-14 text-xl opacity-90">🎊</div>

                    {/* Titre */}
                    <div>
                      <h3 className="text-xl font-black drop-shadow-2xl tracking-widest uppercase mb-1">
                        {promo.title.split(' ')[0]}
                      </h3>
                      <h3 className="text-2xl font-black drop-shadow-2xl tracking-wide uppercase text-yellow-300">
                        {promo.title.split(' ')[1]}
                      </h3>
                    </div>

                    {/* Description + CTA */}
                    <div className="self-end text-right">
                      <p className="text-sm font-bold opacity-95 drop-shadow-lg mb-3">
                        {promo.description}
                      </p>
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-purple-900 rounded-2xl font-black text-sm shadow-2xl hover:scale-105 transition-all duration-200">
                        {promo.cta} 🎁
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide 4: Car Rental - Design exact de la référence */}
                {promo.id === '4' && (
                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                    {/* Pattern lignes verticales subtiles */}
                    <div className="absolute inset-0 opacity-10">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-px bg-white" style={{ left: `${i * 12.5}%` }} />
                      ))}
                    </div>

                    {/* Emoji voiture + titre */}
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">🚗</div>
                      <h3 className="text-xl font-black drop-shadow-lg tracking-tight">
                        {promo.title}
                      </h3>
                    </div>

                    {/* Prix + CTA en bas */}
                    <div className="flex items-end justify-between">
                      {/* Prix dans un badge arrondi */}
                      <div className="inline-flex items-baseline gap-1.5 px-6 py-3 bg-white/25 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl">
                        <span className="text-3xl font-black drop-shadow-lg">50 000 CDF</span>
                        <span className="text-base font-bold opacity-90">/jour</span>
                      </div>
                      
                      {/* CTA Button */}
                      <div className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl font-bold text-sm hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Déco blur circles */}
                    <div className="absolute top-6 right-6 w-20 h-20 bg-white/15 rounded-full blur-2xl" />
                    <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Pagination dots - style exact de la référence */}
        <div className="flex justify-center gap-2 mt-4">
          {defaultPromos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                current === index
                  ? 'w-8 bg-[#E31E24]'
                  : 'w-2 bg-gray-400/60 hover:bg-gray-400'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
