import { useEffect, useState, useRef, useCallback, memo } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { usePromos } from '@/hooks/usePromos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePromoCodeValidation } from '@/hooks/usePromoCodeValidation';
import { CompactRentalSlide } from '@/components/rental/CompactRentalSlide';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChristmasSlide } from './ChristmasSlide';

interface PromoSliderProps {
  onServiceSelect: (service: string) => void;
}

// ✅ PHASE 1: Component optimisé avec React.memo
const PromoSliderOptimized = memo(({ onServiceSelect }: PromoSliderProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { user } = useAuth();
  const { checkPromoUsage } = usePromoCodeValidation();
  const { t } = useLanguage();
  
  // ✅ PHASE 1: Stabiliser autoplayRef avec useRef
  const autoplayRef = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
      playOnInit: true,
      rootNode: (emblaRoot) => emblaRoot.parentElement,
    })
  );

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    const autoplay = autoplayRef.current;
    if (autoplay) {
      autoplay.play();
    }

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // ✅ PHASE 1: Optimiser watchdog
  useEffect(() => {
    if (!api) return;

    const autoplay = autoplayRef.current;
    
    const checkAutoplay = () => {
      if (autoplay && !autoplay.isPlaying()) {
        autoplay.play();
      }
    };

    const watchdogInterval = setInterval(checkAutoplay, 5000);

    api.on('select', () => {
      if (autoplay && !autoplay.isPlaying()) {
        autoplay.play();
      }
    });

    const handleVisibilityChange = () => {
      if (!document.hidden && autoplay) {
        autoplay.play();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(watchdogInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [api]);

  const promos = usePromos();
  
  // ✅ PHASE 1: useCallback pour handlePromoClick
  const handlePromoClick = useCallback(async (promo: typeof promos[0]) => {
    if (promo.id === '1') {
      if (!user) {
        toast.error(t('promo.login_required'));
        return;
      }

      const result = await checkPromoUsage(user.id, 'BIENVENUE30');

      if (!result.canUse) {
        toast.error(result.reason || t('promo.code_already_used'));
        return;
      }

      localStorage.setItem('activePromoCode', 'BIENVENUE30');
      localStorage.setItem('promoDiscount', '30');
      localStorage.setItem('activePromoId', result.promoId || '');
      toast.success(t('promo.code_applied'));
    }

    if (promo.service) {
      onServiceSelect(promo.service);
    }
  }, [user, checkPromoUsage, t, onServiceSelect]);

  return (
    <div className="w-full relative mb-8 mx-auto max-w-7xl z-10 pt-1 px-2">
      {/* Container épuré */}
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: 'center', skipSnaps: false, duration: 30 }}
          plugins={[autoplayRef.current]}
          className="w-full"
          style={{ minHeight: '140px', height: '140px' }}
        >
          <CarouselContent style={{ height: '140px' }}>
            {promos.map((promo, index) => (
              <CarouselItem key={promo.id} className="h-[140px]">
                <motion.div
                  onClick={() => handlePromoClick(promo)}
                  className={cn(
                    'relative h-[140px] cursor-pointer overflow-hidden',
                    'bg-gradient-to-br',
                    promo.gradient
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                {/* Effet shimmer subtil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
                
                {/* SLIDE NOËL FESTIF */}
                {promo.id === 'christmas' && (
                  <ChristmasSlide onAction={() => onServiceSelect('transport')} />
                )}
                
                {/* SLIDE NOUVEL AN - Compact */}
                {promo.id === 'newYear' && (
                  <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎆</span>
                      <div>
                        <h3 className="text-lg font-bold">
                          <span className="text-amber-300">Bonne</span> Année 2025
                        </h3>
                        <p className="text-white/80 text-[11px]">Démarrez l'année avec Kwenda</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-amber-400/30 rounded-full text-[11px] font-semibold border border-amber-400/40">
                      Découvrir →
                    </button>
                  </div>
                )}
                
                {/* SLIDE 1: 30% Discount - Compact */}
                {promo.id === '1' && (
                  <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎉</span>
                      <div>
                        <h3 className="text-lg font-bold">30% de réduction</h3>
                        <p className="text-white/80 text-[11px]">Sur votre première course</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white/20 rounded-full text-[11px] font-semibold border border-white/30">
                      Commander →
                    </button>
                  </div>
                )}

                {/* SLIDE 2: Flash Express - Compact */}
                {promo.id === '2' && (
                  <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⚡</span>
                      <div>
                        <h3 className="text-lg font-bold">Livraison Express</h3>
                        <p className="text-white/80 text-[11px]">En 30 minutes chrono</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white/20 rounded-full text-[11px] font-semibold border border-white/30">
                      Livrer →
                    </button>
                  </div>
                )}

                {/* SLIDE 3: Tombola - Compact */}
                {promo.id === '3' && (
                  <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎰</span>
                      <div>
                        <h3 className="text-lg font-bold">Tombola KwendaPay</h3>
                        <p className="text-yellow-300/80 text-[11px]">Gagnez jusqu'à 100 000 CDF</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-yellow-400/20 rounded-full text-[11px] font-semibold border border-yellow-400/40">
                      Participer →
                    </button>
                  </div>
                )}

                {/* Slide 4: Car Rental */}
                {promo.id === '4' && (
                  <CompactRentalSlide 
                    onReserve={() => onServiceSelect('rental')}
                    vehicleCount={25}
                    startingPrice={50000}
                  />
                )}

                {/* SLIDE 5: Marketplace - Compact */}
                {promo.id === '5' && (
                  <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🛒</span>
                      <div>
                        <h3 className="text-lg font-bold">Marketplace Kwenda</h3>
                        <p className="text-white/80 text-[11px]">Achetez, vendez, on livre</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white/20 rounded-full text-[11px] font-semibold border border-white/30">
                      Découvrir →
                    </button>
                  </div>
                )}

                {/* SLIDE 6: Food - Compact */}
                {promo.id === '6' && (
                  <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🍔</span>
                      <div>
                        <h3 className="text-lg font-bold">Kwenda Food</h3>
                        <p className="text-white/80 text-[11px]">Livraison de plats chauds</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white/20 rounded-full text-[11px] font-semibold border border-white/30">
                      Commander →
                    </button>
                  </div>
                )}
              </motion.div>
            </CarouselItem>
          ))}
          </CarouselContent>
          
          {/* Compteur compact en haut à droite */}
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium">
            {current + 1}/{promos.length}
          </div>
        </Carousel>
      </div>

      {/* Dots indicator compacts */}
      <div className="flex justify-center items-center gap-1.5 mt-3">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'rounded-full transition-all duration-200',
              current === index
                ? 'w-5 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
            )}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

PromoSliderOptimized.displayName = 'PromoSliderOptimized';

export { PromoSliderOptimized as PromoSlider };
