import { useEffect, useState, useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { usePromos } from '@/hooks/usePromos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
  
  // 🆕 PHASE 1: Logs de debug pour vérifier l'affichage
  useEffect(() => {
    console.log('🎨 [PromoSlider] Nombre de promos chargées:', promos.length);
    console.log('🎨 [PromoSlider] Carousel API:', api ? 'Initialisé' : 'En attente');
    console.log('🎨 [PromoSlider] Slide actuel:', current);
  }, [promos, api, current]);
  
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
    <div className="w-full relative mb-8 mx-auto max-w-7xl">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'center' }}
        plugins={[autoplayRef.current]}
        className="w-full min-h-[140px]"
      >
        <CarouselContent className="h-[140px]">
          {promos.map((promo) => (
            <CarouselItem key={promo.id} className="h-[140px]">
              <div
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-[140px] rounded-2xl overflow-hidden cursor-pointer',
                  'bg-gradient-to-br',
                  promo.gradient,
                  'shadow-lg hover:shadow-xl',
                  'transition-shadow duration-300'
                )}
              >
                
                {/* SLIDE 1: 30% Discount - Minimaliste */}
                {promo.id === '1' && (
                  <div className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-4xl sm:text-5xl opacity-90">
                        🎉
                      </div>
                      
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-bold tracking-tight mb-0.5 sm:mb-1">
                          30% de réduction
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm font-medium">
                          Sur votre première course
                        </p>
                      </div>
                    </div>

                    <button className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border border-white/30">
                      Commander →
                    </button>
                  </div>
                )}

                {/* SLIDE 2: Flash Express - Minimaliste */}
                {promo.id === '2' && (
                  <div className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-4xl sm:text-5xl opacity-90">
                        ⚡
                      </div>
                      
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-bold tracking-tight mb-0.5 sm:mb-1">
                          Livraison Express
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm font-medium">
                          En 30 minutes chrono
                        </p>
                      </div>
                    </div>

                    <button className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border border-white/30">
                      Livrer →
                    </button>
                  </div>
                )}

                {/* SLIDE 3: Tombola - Élégant */}
                {promo.id === '3' && (
                  <div className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-4xl sm:text-5xl opacity-90">
                        🎰
                      </div>
                      
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-bold tracking-tight mb-0.5 sm:mb-1">
                          Tombola KwendaPay
                        </h3>
                        <p className="text-yellow-300/90 text-xs sm:text-sm font-semibold">
                          Gagnez jusqu'à 100 000 CDF
                        </p>
                      </div>
                    </div>

                    <button className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-yellow-400/20 hover:bg-yellow-400/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border border-yellow-400/40">
                      Participer →
                    </button>
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

                {/* SLIDE 5: Marketplace - Clean */}
                {promo.id === '5' && (
                  <div className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-4xl sm:text-5xl opacity-90">
                        🛒
                      </div>
                      
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-bold tracking-tight mb-0.5 sm:mb-1">
                          Marketplace Kwenda
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm font-medium">
                          Achetez, vendez, on livre
                        </p>
                      </div>
                    </div>

                    <button className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border border-white/30">
                      Découvrir →
                    </button>
                  </div>
                )}

                {/* SLIDE 6: Food - Simple */}
                {promo.id === '6' && (
                  <div className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-4xl sm:text-5xl opacity-90">
                        🍔
                      </div>
                      
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-bold tracking-tight mb-0.5 sm:mb-1">
                          Kwenda Food
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm font-medium">
                          Vos restaurants préférés livrés
                        </p>
                      </div>
                    </div>

                    <button className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border border-white/30">
                      Commander →
                    </button>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Dots indicator - minimaliste */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {promos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === index 
                  ? "w-8 bg-white" 
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
