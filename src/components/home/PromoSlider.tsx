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
                  'relative h-32 sm:h-36 rounded-2xl overflow-hidden shadow-lg cursor-pointer group',
                  'bg-gradient-to-br',
                  promo.gradient,
                  'transition-transform duration-200 hover:scale-[1.01]'
                )}
              >
                {/* Base overlays - STABLE */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)] opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Layout Slide 1: Hero Bold (30% promo) */}
                {promo.id === '1' && (
                  <>
                    {/* Badge promo top-right STABLE */}
                    <div className="absolute top-3 right-3 bg-yellow-400 text-black px-2.5 py-1 rounded-full font-black text-[10px] rotate-12 shadow-xl z-10 animate-pulse-stable">
                      {promo.description}
                    </div>

                    {/* Titre hero incliné top-left */}
                    <div className="absolute top-4 left-4 text-white">
                      <h3 className="text-2xl sm:text-3xl font-black drop-shadow-2xl -rotate-2 leading-none mb-1 animate-fade-in tracking-tight">
                        30% OFF
                      </h3>
                      <p className="text-xs sm:text-sm font-bold opacity-95 drop-shadow-lg">
                        sur ta 1ère course 🎉
                      </p>
                    </div>

                    {/* Gros CTA bottom-left */}
                    <div className="absolute bottom-4 left-4 bg-white text-primary px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200">
                      {promo.cta} →
                    </div>

                    {/* Déco cercles STABLE */}
                    <div className="absolute bottom-6 right-6 w-20 h-20 bg-white/20 rounded-full blur-3xl opacity-60" />
                    <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/10 rounded-full blur-2xl opacity-40" />
                  </>
                )}

                {/* Layout Slide 2: Centered Impact (Livraison) */}
                {promo.id === '2' && (
                  <>
                    {/* Lignes diagonales déco */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-white rotate-12 origin-left" />
                      <div className="absolute bottom-0 right-0 w-full h-0.5 bg-white -rotate-12 origin-right" />
                    </div>

                    {/* Contenu centré */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                      <div className="mb-2 text-3xl sm:text-4xl">📦</div>
                      <h3 className="text-xl sm:text-2xl font-extrabold drop-shadow-2xl mb-1 tracking-tight">
                        {promo.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-bold opacity-90 drop-shadow-lg mb-3 max-w-[80%]">
                        {promo.description}
                      </p>
                      
                      {/* CTA pill ultra-arrondi */}
                      <div className="px-6 py-2 bg-white/90 text-yellow-600 rounded-full font-black text-xs sm:text-sm shadow-xl hover:scale-105 hover:bg-white transition-all duration-200 backdrop-blur-sm">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Déco dots pattern */}
                    <div className="absolute top-2 left-2 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute bottom-2 right-2 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                  </>
                )}

                {/* Layout Slide 3: Split Diagonal (Tombola) */}
                {promo.id === '3' && (
                  <>
                    {/* Chiffre géant en background */}
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-white/10 font-black text-6xl sm:text-7xl leading-none select-none">
                      100K
                    </div>

                    {/* Confettis déco STABLE */}
                    <div className="absolute top-3 left-6 text-2xl opacity-90">🎉</div>
                    <div className="absolute top-8 right-12 text-xl opacity-80">✨</div>
                    <div className="absolute bottom-6 left-12 text-lg opacity-90">🎊</div>

                    {/* Disposition diagonale */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                      {/* Titre top-left en CAPS */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-black drop-shadow-2xl tracking-widest uppercase mb-0.5">
                          {promo.title.split(' ')[0]}
                        </h3>
                        <h3 className="text-xl sm:text-2xl font-black drop-shadow-2xl tracking-wide uppercase text-yellow-300">
                          {promo.title.split(' ')[1]}
                        </h3>
                      </div>

                      {/* Description + CTA bottom-right */}
                      <div className="self-end text-right">
                        <p className="text-xs sm:text-sm font-bold opacity-95 drop-shadow-lg mb-2">
                          {promo.description}
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-purple-900 rounded-xl font-black text-xs sm:text-sm shadow-2xl hover:scale-105 transition-all duration-200 animate-pulse-stable">
                          {promo.cta} 🎁
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Layout Slide 4: Bottom Corner Card (Location) */}
                {promo.id === '4' && (
                  <>
                    {/* Silhouette voiture watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-7xl sm:text-8xl">
                      🚗
                    </div>

                    {/* Pattern lignes verticales */}
                    <div className="absolute inset-0 opacity-10">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${i * 20}%` }} />
                      ))}
                    </div>

                    {/* Titre + icône top-left */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 text-white">
                      <div className="text-2xl">🚙</div>
                      <h3 className="text-base sm:text-lg font-black drop-shadow-lg tracking-tight">
                        {promo.title}
                      </h3>
                    </div>

                    {/* Prix highlighted bottom-right */}
                    <div className="absolute bottom-4 right-4 text-right text-white">
                      <div className="inline-block px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg mb-2 border border-white/40">
                        <p className="text-lg sm:text-xl font-black drop-shadow-lg">
                          50 000 CDF
                          <span className="text-xs font-bold opacity-90">/jour</span>
                        </p>
                      </div>
                      
                      {/* CTA minimaliste */}
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold opacity-95 hover:opacity-100 transition-opacity group-hover:translate-x-1 transition-transform">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Déco blur circles */}
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/15 rounded-full blur-2xl" />
                  </>
                )}
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
