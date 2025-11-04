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
    <div className="w-full relative mb-12 mx-auto max-w-7xl z-10">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'center', skipSnaps: false, duration: 30 }}
        plugins={[autoplayRef.current]}
        className="w-full"
        style={{ minHeight: '160px', height: '160px' }}
      >
        <CarouselContent style={{ height: '160px' }}>
          {promos.map((promo) => (
            <CarouselItem key={promo.id} className="h-[160px]">
              <motion.div
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-[160px] rounded-2xl cursor-pointer',
                  'bg-gradient-to-br',
                  promo.gradient,
                  'shadow-lg hover:shadow-xl',
                  'transition-shadow duration-300'
                )}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* SLIDE 1: 30% Discount */}
                {promo.id === '1' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🎉
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          30% de réduction
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Sur votre première course
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Commander →
                    </motion.button>
                  </motion.div>
                )}

                {/* SLIDE 2: Flash Express */}
                {promo.id === '2' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        ⚡
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Livraison Express
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          En 30 minutes chrono
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Livrer →
                    </motion.button>
                  </motion.div>
                )}

                {/* SLIDE 3: Tombola */}
                {promo.id === '3' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🎰
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Tombola KwendaPay
                        </motion.h3>
                        <motion.p 
                          className="text-yellow-300/90 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Gagnez jusqu'à 100 000 CDF
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-yellow-400/20 hover:bg-yellow-400/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-yellow-400/40"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Participer →
                    </motion.button>
                  </motion.div>
                )}

                {/* Slide 4: Car Rental */}
                {promo.id === '4' && (
                  <CompactRentalSlide 
                    onReserve={() => onServiceSelect('rental')}
                    vehicleCount={25}
                    startingPrice={50000}
                  />
                )}

                {/* SLIDE 5: Marketplace */}
                {promo.id === '5' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🛒
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Marketplace Kwenda
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Achetez, vendez, on livre
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Découvrir →
                    </motion.button>
                  </motion.div>
                )}

                {/* SLIDE 6: Food */}
                {promo.id === '6' && (
                  <motion.div 
                    className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <motion.div 
                        className="text-4xl sm:text-5xl opacity-90"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, 0, -2, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🍔
                      </motion.div>
                      
                      <div>
                        <motion.h3 
                          className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          Kwenda Food
                        </motion.h3>
                        <motion.p 
                          className="text-white/80 text-xs sm:text-sm font-bold"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Livraison de plats chauds
                        </motion.p>
                      </div>
                    </div>

                    <motion.button 
                      className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Commander →
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {promos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                current === index
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Aller à la slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
});

PromoSliderOptimized.displayName = 'PromoSliderOptimized';

export { PromoSliderOptimized as PromoSlider };
