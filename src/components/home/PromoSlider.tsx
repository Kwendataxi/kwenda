import { useEffect, useState, useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { usePromos } from '@/hooks/usePromos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShoppingBag, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePromoCodeValidation } from '@/hooks/usePromoCodeValidation';
import { CompactRentalSlide } from '@/components/rental/CompactRentalSlide';

interface PromoSliderProps {
  onServiceSelect: (service: string) => void;
}

export const PromoSlider = ({ onServiceSelect }: PromoSliderProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { user } = useAuth();
  const { checkPromoUsage } = usePromoCodeValidation();
  
  const autoplayRef = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
    })
  );

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const promos = usePromos();
  
  const handlePromoClick = async (promo: typeof promos[0]) => {
    // Gestion code promo BIENVENUE30
    if (promo.id === '1') {
      // Vérifier si l'utilisateur est connecté
      if (!user) {
        toast.error('Connectez-vous pour utiliser ce code promo');
        return;
      }

      // Vérifier si le code a déjà été utilisé
      const result = await checkPromoUsage(user.id, 'BIENVENUE30');

      if (!result.canUse) {
        toast.error(result.reason || 'Code promo déjà utilisé');
        return;
      }

    // Si OK, stocker le code et son ID
    localStorage.setItem('activePromoCode', 'BIENVENUE30');
    localStorage.setItem('promoDiscount', '30');
    localStorage.setItem('activePromoId', result.promoId || '');
    toast.success('Code promo BIENVENUE30 appliqué ! Valable une seule fois.');
    }

    // Redirection vers le service
    if (promo.service) {
      onServiceSelect(promo.service);
    }
  };

  return (
    <div className="w-full relative">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'start' }}
        plugins={[autoplayRef.current]}
        className="w-full"
      >
        <CarouselContent className="h-[140px]">
          {promos.map((promo) => (
            <CarouselItem key={promo.id} className="h-[140px]">
              <div
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-[140px] rounded-2xl overflow-hidden cursor-pointer group',
                  'bg-gradient-to-br shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
                  promo.gradient,
                  'transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)] hover:scale-[1.01]'
                )}
              >
                {/* Base gradient background */}
                <div className={`absolute inset-0 ${promo.gradient}`} />
                
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                
                {/* Slide 1: 30% Discount - Layout horizontal compact */}
            {promo.id === '1' && (
              <div className="absolute inset-0 p-3 flex items-center text-white">
                <div className="absolute top-2 right-2 bg-yellow-400 text-pink-600 px-2 py-0.5 rounded-full font-black text-[9px] shadow-lg">
                  1ère COURSE
                </div>

                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black drop-shadow-lg leading-tight">
                      🎉 30% OFF
                    </h3>
                    
                    {/* Code promo discret */}
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-[10px] text-white/70">Code:</span>
                      <span className="text-xs font-bold text-white">BIENVENUE30</span>
                    </div>
                  </div>
                  
                  <button className="bg-white text-pink-600 px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">
                    Commander →
                  </button>
                </div>

                {/* Glow ultra-subtil */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
              </div>
            )}

                {/* Slide 2: Flash Express - Layout horizontal */}
            {promo.id === '2' && (
              <div className="absolute inset-0 p-3 flex items-center text-white">
                <div className="absolute top-2 right-2 bg-yellow-400/90 text-orange-900 px-2 py-0.5 rounded-full text-[9px] font-black">
                  EXPRESS
                </div>

                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black drop-shadow-lg leading-tight">
                      ⚡ Livraison Flash<br />Express
                    </h3>
                    <span className="text-[10px] text-white/80 mt-1 inline-block">
                      30 min chrono
                    </span>
                  </div>
                  
                  <button className="bg-white text-orange-600 px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">
                    Livrer →
                  </button>
                </div>

                {/* Glow statique subtil */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}

                {/* Slide 3: Tombola - Layout horizontal compact */}
            {promo.id === '3' && (
              <div className="absolute inset-0 p-3 flex items-center text-white">
                <div className="absolute top-2 right-2 bg-yellow-400 text-purple-900 text-[9px] font-black px-2 py-0.5 rounded-full">
                  NOUVEAU
                </div>

                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black leading-tight">
                      🎰 Tombola<br />
                      <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                        KwendaPay
                      </span>
                    </h3>
                    
                    {/* Montant inline discret */}
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-[10px] text-white/70">Jusqu'à</span>
                      <span className="text-sm font-black text-yellow-300">100K CDF</span>
                    </div>
                  </div>
                  
                  <button className="bg-yellow-400 text-purple-900 px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">
                    Participer 🎁
                  </button>
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_70%)] pointer-events-none" />
              </div>
            )}

                {/* Slide 4: Car Rental - Modern Compact Version */}
                {promo.id === '4' && (
                  <CompactRentalSlide 
                    onReserve={() => onServiceSelect('rental')}
                    vehicleCount={25}
                    startingPrice={50000}
                  />
                )}

                {/* Slide 5: Marketplace - Layout horizontal */}
            {promo.id === '5' && (
              <div className="absolute inset-0 p-3 flex items-center text-white">
                <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                  NOUVEAU
                </div>
                
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                      🛒 Achetez, vendez,<br />on livre !
                    </h3>
                    <p className="text-[10px] text-white/80 mt-1">100% sécurisé</p>
                  </div>
                  
                  <button className="bg-white text-primary px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">
                    Shopping →
                  </button>
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}

                {/* Slide 6: Food - Layout horizontal */}
            {promo.id === '6' && (
              <div className="absolute inset-0 p-3 flex items-center text-white">
                <div className="absolute top-2 right-2 bg-yellow-400/90 text-orange-900 px-2 py-0.5 rounded-full text-[9px] font-black">
                  NOUVEAU
                </div>

                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                      🍕 Kwenda Food
                    </h3>
                    <span className="text-[10px] text-white/80 mt-1 inline-block">
                      30-45 min
                    </span>
                  </div>
                  
                  <button className="bg-orange-400 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">
                    Commander 🍕
                  </button>
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Dots indicator - intégrés dans le slider */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {promos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === index 
                  ? "w-8 bg-white shadow-lg" 
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
