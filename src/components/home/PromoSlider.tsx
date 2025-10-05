import { useEffect, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { defaultPromos } from '@/data/promos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShoppingBag, Truck, Zap, Bike } from 'lucide-react';

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
                  'relative h-36 rounded-2xl overflow-hidden cursor-pointer group',
                  'bg-gradient-to-br shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
                  promo.gradient,
                  'transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)] hover:scale-[1.01]'
                )}
              >
                {/* Overlay gradients sophistiqués */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
                
                {/* Slide 1: 30% Discount */}
                {promo.id === '1' && (
                  <div className="absolute inset-0 p-4 flex items-center justify-between text-white">
                    {/* Contenu gauche */}
                    <div className="flex-1">
                      <h3 className="text-3xl font-black drop-shadow-2xl leading-none mb-1.5 -rotate-1">
                        30% OFF
                      </h3>
                      <p className="text-sm font-bold opacity-95 drop-shadow-lg mb-2">
                        sur ta 1ère course 🎉
                      </p>
                      
                      {/* CTA Button */}
                      <div className="inline-block bg-white text-primary px-5 py-2 rounded-xl font-black text-xs shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Badge promo à droite */}
                    <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-black text-xs shadow-xl rotate-3 animate-pulse">
                      {promo.description}
                    </div>

                    {/* Déco circles */}
                    <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/20 rounded-full blur-2xl" />
                  </div>
                )}

                {/* Slide 2: Flash Express Delivery - Modern & Clean */}
                {promo.id === '2' && (
                  <div className="absolute inset-0 p-3 flex flex-col text-white">
                    {/* Header with badge + lightning icon */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-black/40 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full font-black text-[9px] shadow-lg border border-white/20">
                        EXPRESS
                      </div>
                      <Zap 
                        className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]" 
                        fill="currentColor" 
                        strokeWidth={0}
                      />
                    </div>

                    {/* Main content - centered and compact */}
                    <div className="flex-1 flex flex-col justify-center relative z-10 -mt-2">
                      <h3 className="text-2xl font-black drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] leading-none tracking-tighter mb-0.5 bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent">
                        Livrez Rapide
                      </h3>
                      <h3 className="text-2xl font-black drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] leading-none tracking-tighter bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent">
                        en Flash
                      </h3>
                    </div>

                    {/* Footer with timing + CTA - compact */}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                        30 min
                      </div>
                      
                      <div className="inline-flex items-center gap-1 px-4 py-1.5 bg-white text-orange-600 rounded-xl font-black text-[11px] shadow-[0_4px_15px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-200">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Enhanced glow effects - animated */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-28 h-28 bg-yellow-400/40 rounded-full blur-3xl animate-pulse pointer-events-none" />
                    <div className="absolute top-1/2 -translate-y-1/2 right-6 w-20 h-20 bg-orange-400/30 rounded-full blur-2xl pointer-events-none" />
                  </div>
                )}

                {/* Slide 3: Lottery */}
                {promo.id === '3' && (
                  <div className="absolute inset-0 p-4 flex items-center justify-between text-white">
                    {/* Background text */}
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-white/10 font-black text-5xl leading-none select-none">
                      100K
                    </div>

                    {/* Confettis */}
                    <div className="absolute top-2 left-6 text-2xl opacity-90">🎉</div>
                    <div className="absolute top-4 right-10 text-xl opacity-80">✨</div>
                    <div className="absolute bottom-3 left-10 text-lg opacity-90">🎊</div>

                    {/* Titre gauche */}
                    <div>
                      <h3 className="text-lg font-black drop-shadow-2xl tracking-widest uppercase">
                        {promo.title.split(' ')[0]}
                      </h3>
                      <h3 className="text-xl font-black drop-shadow-2xl tracking-wide uppercase text-yellow-300">
                        {promo.title.split(' ')[1]}
                      </h3>
                      <p className="text-xs font-bold opacity-95 drop-shadow-lg mt-1">
                        {promo.description}
                      </p>
                    </div>

                    {/* CTA à droite */}
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 text-purple-900 rounded-xl font-black text-xs shadow-xl hover:scale-105 transition-all duration-200">
                      {promo.cta} 🎁
                    </div>
                  </div>
                )}

                {/* Slide 4: Car Rental */}
                {promo.id === '4' && (
                  <div className="absolute inset-0 p-4 flex items-center justify-between text-white">
                    {/* Pattern lignes verticales subtiles */}
                    <div className="absolute inset-0 opacity-10">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-px bg-white" style={{ left: `${i * 12.5}%` }} />
                      ))}
                    </div>

                    {/* Emoji voiture + titre + prix */}
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🚗</div>
                      <div>
                        <h3 className="text-base font-black drop-shadow-lg tracking-tight mb-0.5">
                          {promo.title}
                        </h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black drop-shadow-lg">50 000 CDF</span>
                          <span className="text-xs font-bold opacity-90">/jour</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA Button */}
                    <div className="px-5 py-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-xl font-bold text-xs hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap">
                      {promo.cta} →
                    </div>

                    {/* Déco blur circles */}
                    <div className="absolute top-3 right-3 w-14 h-14 bg-white/15 rounded-full blur-2xl" />
                    <div className="absolute bottom-1/2 left-1/3 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                  </div>
                )}

                {/* Slide 5: Marketplace */}
                {promo.id === '5' && (
                  <div className="absolute inset-0 p-4 text-white">
                    {/* Badge NOUVEAU - simple et discret */}
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      NOUVEAU
                    </div>
                    
                    {/* Icône principale - grande et centrée à droite */}
                    <ShoppingBag className="absolute bottom-0 right-0 w-32 h-32 text-white/10" strokeWidth={1.5} />
                    
                    {/* Contenu principal - aligné et structuré */}
                    <div className="relative z-10 h-full flex flex-col justify-center">
                      <h3 className="text-2xl font-black drop-shadow-lg leading-tight mb-2">
                        Achetez. Vendez.<br />
                        <span className="text-white/90">On livre.</span>
                      </h3>
                      
                      <p className="text-sm font-semibold opacity-90 mb-4">
                        Marketplace 100% sécurisée
                      </p>
                      
                      {/* CTA */}
                      <div className="inline-block bg-white text-primary px-6 py-2.5 rounded-xl font-black text-sm shadow-xl hover:scale-105 transition-all duration-200 w-fit">
                        {promo.cta} →
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Pagination dots - style exact de la référence */}
        <div className="flex justify-center gap-1.5 mt-3">
          {defaultPromos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                current === index
                  ? 'w-6 bg-[#E31E24]'
                  : 'w-1.5 bg-gray-400/60 hover:bg-gray-400'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
