import { useEffect, useState, useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { defaultPromos } from '@/data/promos';
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

  const handlePromoClick = async (promo: typeof defaultPromos[0]) => {
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
    <div className="w-full relative space-y-3">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'start' }}
        plugins={[autoplayRef.current]}
        className="w-full h-[140px]"
      >
        <CarouselContent className="-ml-2 md:-ml-4 h-[140px]">
          {defaultPromos.map((promo) => (
            <CarouselItem key={promo.id} className="pl-2 md:pl-4 h-[140px]">
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
                    {/* Badge compact en haut à droite */}
                    <div className="absolute top-2 right-2 bg-yellow-400 text-pink-600 px-2.5 py-1 rounded-full font-black text-[10px] shadow-lg">
                      1ère COURSE
                    </div>

                    {/* Layout horizontal : Texte à gauche, CTA à droite */}
                    <div className="flex items-center justify-between w-full gap-3">
                      {/* Partie gauche : Offre */}
                      <div className="flex-1 space-y-1">
              <motion.h3 
                className="text-4xl font-black drop-shadow-2xl leading-none"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                🎉 30% OFF
              </motion.h3>
                        
                        {/* Code promo inline */}
                        <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                          <span className="text-[10px] opacity-75">Code:</span>
                          <span className="text-xs font-black">BIENVENUE30</span>
                        </div>
                      </div>
                      
                      {/* Partie droite : CTA compact */}
                      <motion.button 
                        className="bg-white text-pink-600 px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        Commander →
                      </motion.button>
                    </div>

                    {/* Glow effects subtils */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
                  </div>
                )}

                {/* Slide 2: Flash Express - Layout horizontal */}
                {promo.id === '2' && (
                  <div className="absolute inset-0 p-3 flex items-center text-white">
                    {/* Badge + Icon en haut */}
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <div className="bg-yellow-400/90 text-orange-900 px-2 py-0.5 rounded-full text-[9px] font-black">
                        EXPRESS
                      </div>
                      <Zap className="w-5 h-5 text-yellow-300 drop-shadow-glow" fill="currentColor" strokeWidth={0} />
                    </div>

                    {/* Contenu principal horizontal */}
                    <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h3 className="text-3xl font-black drop-shadow-lg leading-tight bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                  ⚡ Livraison<br />Flash Express
                </h3>
                        <span className="text-[10px] font-bold bg-white/10 backdrop-blur px-2 py-0.5 rounded-md mt-1 inline-block">
                          ⚡ 30 min
                        </span>
                      </div>
                      
                      <button className="bg-white text-orange-600 px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">
                        Livrer →
                      </button>
                    </div>

                    {/* Glow animé */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-400/30 rounded-full blur-3xl animate-pulse pointer-events-none" />
                  </div>
                )}

                {/* Slide 3: Tombola - Layout horizontal compact */}
                {promo.id === '3' && (
                  <div className="absolute inset-0 p-3 flex items-center text-white">
                    {/* Badge + Emoji compacts */}
                    <div className="absolute top-2 left-2 bg-yellow-400 text-purple-900 text-[9px] font-black px-2.5 py-0.5 rounded-full">
                      NOUVEAU
                    </div>
                    <div className="absolute top-2 right-2 text-2xl">🎉</div>

                    {/* Layout horizontal */}
                    <div className="flex items-center justify-between w-full gap-3">
                      {/* Partie gauche */}
              <div className="flex-1 space-y-1">
                <h3 className="text-2xl font-black leading-tight">
                  🎰 Tombola<br />
                  <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                    KwendaPay
                  </span>
                </h3>
                        
                        {/* Montant bubble inline */}
                        <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-purple-900 px-3 py-1.5 rounded-xl shadow-lg">
                          <span className="text-xs font-medium">Jusqu'à</span>
                          <span className="text-base font-black">100K CDF</span>
                        </div>
                      </div>
                      
                      {/* CTA */}
                      <button className="bg-yellow-400 text-purple-900 px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all border-2 border-yellow-300">
                        Participer 🎁
                      </button>
                    </div>

                    {/* Glow central */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.15),transparent_70%)] pointer-events-none" />
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
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-white/20">
                      NOUVEAU
                    </div>
                    
                    <ShoppingBag className="absolute bottom-2 right-2 w-16 h-16 text-white/10" strokeWidth={1.5} />
                    
                    <div className="flex items-center justify-between w-full gap-3">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                🛒 Achetez, vendez,<br />
                <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  on livre !
                </span>
              </h3>
                        <p className="text-[10px] font-bold opacity-90 mt-1">100% sécurisé</p>
                      </div>
                      
                      <button className="bg-white text-primary px-5 py-2 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all">
                        Shopping →
                      </button>
                    </div>

                    <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
                  </div>
                )}

                {/* Slide 6: Food - Layout horizontal */}
                {promo.id === '6' && (
                  <div className="absolute inset-0 p-3 flex items-center text-white">
                    <div className="absolute top-2 left-2 bg-yellow-400/90 text-orange-900 px-2.5 py-0.5 rounded-full text-[9px] font-black">
                      NOUVEAU
                    </div>
                    <div className="absolute top-2 right-2 text-2xl">🍔</div>

                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                          🍕 Kwenda<br />
                          <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                            Food
                          </span>
                        </h3>
                        <span className="text-[10px] font-bold bg-orange-400/20 backdrop-blur px-2 py-0.5 rounded-md mt-1 inline-block">
                          🍕 30-45 min
                        </span>
                      </div>
                      
                      <button className="bg-orange-400 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl hover:scale-105 transition-all border-2 border-orange-300">
                        Commander 🍕
                      </button>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-400/20 rounded-full blur-[80px] pointer-events-none" />
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-2">
        {defaultPromos.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              current === index 
                ? 'w-6 bg-primary shadow-glow' 
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
