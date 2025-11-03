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
        className="w-full min-h-[180px] sm:min-h-[200px]"
      >
        <CarouselContent className="h-[180px] sm:h-[200px]">
          {promos.map((promo) => (
            <CarouselItem key={promo.id} className="h-[180px] sm:h-[200px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-[180px] sm:h-[200px] rounded-3xl overflow-hidden cursor-pointer group',
                  'bg-gradient-to-br',
                  promo.gradient,
                  'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
                  'hover:shadow-[0_16px_48px_rgba(0,0,0,0.24)]',
                  'hover:scale-[1.02]',
                  'transition-all duration-500 ease-out',
                  'border border-white/10'
                )}
              >
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-md border border-white/20" />
                
                {/* Slide 1: 30% Discount - Modern vertical layout */}
            {promo.id === '1' && (
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-pink-900 px-3 py-1 rounded-full font-black text-xs shadow-2xl animate-pulse">
                  🎁 1ère COURSE
                </div>

                <div className="flex-1 flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <motion.div 
                      className="text-5xl sm:text-6xl"
                      animate={{ 
                        y: [0, -8, 0],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🎉
                    </motion.div>
                    
                    <div className="flex-1">
                      <h3 className="text-3xl sm:text-4xl font-black drop-shadow-2xl leading-none tracking-tight">
                        30% OFF
                      </h3>
                      
                      <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-xl">
                        <span className="text-xs text-white/90 font-medium">Code:</span>
                        <span className="text-sm font-black text-white tracking-wider">BIENVENUE30</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-white text-pink-600 py-3 rounded-2xl font-bold text-base shadow-2xl hover:scale-105 transition-transform duration-300">
                  Commander maintenant →
                </button>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
              </div>
            )}

                {/* Slide 2: Flash Express - Modern vertical layout */}
            {promo.id === '2' && (
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <div className="absolute top-3 right-3 bg-yellow-400 text-orange-900 px-3 py-1 rounded-full text-xs font-black animate-pulse flex items-center gap-1">
                  <Zap className="w-3 h-3" fill="currentColor" />
                  EXPRESS
                </div>

                <div className="flex-1 flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <motion.div 
                      className="text-5xl sm:text-6xl"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      ⚡
                    </motion.div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-black drop-shadow-2xl leading-tight tracking-tight">
                        Livraison Flash<br />
                        <span className="text-yellow-300">Express</span>
                      </h3>
                      
                      <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-lg">
                        <span className="text-sm font-bold">⏱️ 30 min chrono</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-white text-orange-600 py-3 rounded-2xl font-bold text-base shadow-2xl hover:scale-105 transition-transform duration-300">
                  Livrer maintenant →
                </button>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-400/25 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}

                {/* Slide 3: Tombola - Modern vertical layout */}
            {promo.id === '3' && (
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <div className="absolute top-3 right-3 bg-yellow-400 text-purple-900 text-xs font-black px-3 py-1 rounded-full animate-pulse">
                  ✨ NOUVEAU
                </div>

                <div className="flex-1 flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <motion.div 
                      className="text-5xl sm:text-6xl"
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🎰
                    </motion.div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                        Tombola<br />
                        <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                          KwendaPay
                        </span>
                      </h3>
                      
                      <div className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/30 to-yellow-300/30 backdrop-blur-md border border-yellow-300/40 px-3 py-1.5 rounded-xl">
                        <span className="text-xs text-white/90">Jusqu'à</span>
                        <span className="text-lg font-black text-yellow-300 drop-shadow-lg">100K CDF</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-purple-900 py-3 rounded-2xl font-bold text-base shadow-2xl hover:scale-105 transition-transform duration-300">
                  Participer maintenant 🎁
                </button>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.15),transparent_60%)] pointer-events-none" />
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

                {/* Slide 5: Marketplace - Modern vertical layout */}
            {promo.id === '5' && (
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-full">
                  NOUVEAU
                </div>
                
                <div className="flex-1 flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <motion.div 
                      className="text-5xl sm:text-6xl"
                      animate={{ 
                        y: [0, -5, 0],
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🛒
                    </motion.div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                        Achetez, vendez,<br />on livre !
                      </h3>
                      
                      <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-lg">
                        <span className="text-sm font-bold">🔒 100% sécurisé</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-white text-primary py-3 rounded-2xl font-bold text-base shadow-2xl hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Shopping maintenant →
                </button>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}

                {/* Slide 6: Food - Modern vertical layout */}
            {promo.id === '6' && (
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <div className="absolute top-3 right-3 bg-yellow-400 text-orange-900 px-3 py-1 rounded-full text-xs font-black animate-pulse">
                  NOUVEAU
                </div>

                <div className="flex-1 flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <motion.div 
                      className="text-5xl sm:text-6xl"
                      animate={{ 
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🍕
                    </motion.div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                        Kwenda<br />
                        <span className="text-yellow-300">Food</span>
                      </h3>
                      
                      <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-lg">
                        <span className="text-sm font-bold">⏱️ 30-45 min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white py-3 rounded-2xl font-bold text-base shadow-2xl hover:scale-105 transition-transform duration-300">
                  Commander maintenant 🍕
                </button>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Modern dots indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {promos.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                current === index 
                  ? "w-10 bg-white shadow-[0_2px_12px_rgba(255,255,255,0.6)]" 
                  : "w-2 bg-white/50 hover:bg-white/80 hover:scale-110"
              )}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
