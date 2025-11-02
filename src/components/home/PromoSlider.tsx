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
        className="w-full h-[180px]"
      >
        <CarouselContent className="-ml-2 md:-ml-4 h-[180px]">
          {defaultPromos.map((promo) => (
            <CarouselItem key={promo.id} className="pl-2 md:pl-4 h-[180px]">
              <div
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-[180px] rounded-2xl overflow-hidden cursor-pointer group',
                  'bg-gradient-to-br shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
                  promo.gradient,
                  'transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)] hover:scale-[1.01]'
                )}
              >
                {/* Overlay gradients sophistiqués */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
                
                {/* Slide 1: 30% Discount - MODERNISÉ */}
                {promo.id === '1' && (
                  <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                    {/* Badge FIRST TIME en haut */}
                    <div className="flex justify-end">
                      <div className="bg-yellow-400 text-pink-600 px-3 py-1.5 rounded-full font-black text-xs shadow-xl animate-pulse">
                        1ère COURSE SEULEMENT
                      </div>
                    </div>

                    {/* Zone centrale : Offre principale */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="space-y-2">
                        {/* Titre principal */}
                        <motion.h3 
                          className="text-5xl font-black drop-shadow-2xl leading-none tracking-tighter"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          30% OFF
                        </motion.h3>
                        
                        {/* Emoji + texte accrocheur */}
                        <p className="text-sm font-bold opacity-95 drop-shadow-lg flex items-center gap-1">
                          <span className="text-xl">🎉</span>
                          Première course à -30%
                        </p>
                      </div>
                    </div>

                    {/* Zone inférieure : Code + CTA */}
                    <div className="space-y-3">
                      {/* Badge code promo */}
                      <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/20">
                        <span className="text-xs opacity-75">Code promo</span>
                        <p className="text-base font-black">BIENVENUE30</p>
                      </div>
                      
                      {/* Bouton CTA */}
                      <button className="w-full bg-white text-pink-600 px-6 py-3 rounded-xl font-black text-sm shadow-xl hover:scale-105 transition-all duration-200">
                        {promo.cta} maintenant →
                      </button>
                    </div>

                    {/* Glow effects */}
                    <div className="absolute bottom-4 right-4 w-24 h-24 bg-yellow-400/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/20 rounded-full blur-2xl pointer-events-none" />
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

                {/* Slide 3: Lottery - Design optimisé et équilibré */}
                {promo.id === '3' && (
                  <div className="absolute inset-0 p-5 flex flex-col text-white overflow-hidden">
                    {/* Badge NOUVEAU - Coin supérieur gauche */}
                    <motion.div 
                      className="absolute top-3 left-3 bg-yellow-400 text-purple-900 text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20"
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                    >
                      NOUVEAU
                    </motion.div>

                    {/* Icône célébration - Coin supérieur droit */}
                    <motion.div 
                      className="absolute top-3 right-3 text-3xl z-20"
                      animate={{ 
                        rotate: [0, -5, 5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2
                      }}
                    >
                      🎉
                    </motion.div>

                    {/* Zone supérieure : Titres Tombola + KwendaPay (30%) */}
                    <div className="flex-[0.3] flex items-end justify-center pb-2">
                      <motion.div 
                        className="text-center space-y-0"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h3 className="text-[28px] font-bold drop-shadow-lg leading-tight text-white">
                          Tombola
                        </h3>
                        <motion.h3 
                          className="text-[36px] font-black drop-shadow-2xl leading-none bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          KwendaPay
                        </motion.h3>
                      </motion.div>
                    </div>

                    {/* Zone centrale : Gagnez jusqu'à + Bubble montant (40%) */}
                    <div className="flex-[0.4] flex flex-col items-center justify-center gap-3">
                      <motion.span 
                        className="text-base font-semibold opacity-90 drop-shadow-md tracking-wide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        Gagnez jusqu'à
                      </motion.span>
                      
                      <motion.div 
                        className="bg-yellow-400 text-purple-900 px-7 py-3 rounded-2xl shadow-[0_8px_24px_rgba(234,179,8,0.4)]"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <motion.span 
                          className="text-[26px] font-black tracking-tighter"
                          animate={{ 
                            scale: [1, 1.03, 1]
                          }}
                          transition={{ 
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          100 000 CDF
                        </motion.span>
                      </motion.div>
                    </div>

                    {/* Zone inférieure : CTA Button (30%) */}
                    <div className="flex-[0.3] flex items-start justify-center pt-2">
                      <motion.button
                        className="inline-flex items-center gap-2 px-10 py-3.5 bg-yellow-400 text-purple-900 rounded-full font-black text-base shadow-[0_8px_24px_rgba(234,179,8,0.4)] border-2 border-yellow-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: '0 12px 32px rgba(234,179,8,0.6)'
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {promo.cta} 🎁
                      </motion.button>
                    </div>

                    {/* Effet de lumière central unique et subtil */}
                    <motion.div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-400/20 rounded-full blur-[80px] pointer-events-none"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.3, 0.2]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
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

                {/* Slide 5: Marketplace - Modern & Clean */}
                {promo.id === '5' && (
                  <div className="absolute inset-0 p-4 text-white">
                    {/* Badge NOUVEAU - top right */}
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-white/20">
                      NOUVEAU
                    </div>
                    
                    {/* Shopping bag icon - subtle bottom right */}
                    <ShoppingBag className="absolute bottom-2 right-2 w-20 h-20 text-white/10" strokeWidth={1.5} />
                    
                    {/* Main content */}
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      {/* Title section */}
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-2xl font-black drop-shadow-lg leading-tight mb-2 tracking-tight">
                          Achetez, vendez,<br />
                          <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">livrez !</span>
                        </h3>
                        
                        <p className="text-xs font-semibold opacity-90 drop-shadow-md">
                          Marketplace 100% sécurisée
                        </p>
                      </div>
                      
                      {/* CTA Button */}
                      <div className="inline-block bg-white text-primary px-6 py-2.5 rounded-xl font-black text-sm shadow-xl hover:scale-105 transition-all duration-200 w-fit">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Subtle glow */}
                    <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
                  </div>
                )}

                {/* Slide 6: Food - Style similaire à Tombola */}
                {promo.id === '6' && (
                  <div className="absolute inset-0 p-5 flex flex-col text-white overflow-hidden">
                    {/* Badge NOUVEAU */}
                    <motion.div 
                      className="absolute top-3 left-3 bg-yellow-400/90 text-orange-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                    >
                      NOUVEAU
                    </motion.div>

                    {/* Icône Food */}
                    <motion.div 
                      className="absolute top-3 right-3 text-2xl"
                      animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    >
                      🍔
                    </motion.div>

                    {/* Zone supérieure : Titre */}
                    <div className="flex-[0.3] flex items-end justify-center pb-2">
                      <div className="text-center space-y-1">
                        <motion.h3 
                          className="text-[28px] font-bold drop-shadow-lg leading-tight"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          Kwenda
                        </motion.h3>
                        <motion.h3 
                          className="text-[36px] font-black drop-shadow-2xl leading-none bg-gradient-to-r from-yellow-300 via-orange-100 to-yellow-300 bg-clip-text text-transparent"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          Food
                        </motion.h3>
                      </div>
                    </div>

                    {/* Zone centrale : Description */}
                    <div className="flex-[0.4] flex flex-col items-center justify-center gap-3">
                      <motion.span 
                        className="text-base font-semibold opacity-90 drop-shadow-md tracking-wide"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        Vos restaurants préférés
                      </motion.span>
                      
                      <motion.div 
                        className="bg-orange-400/90 backdrop-blur-sm px-7 py-3 rounded-2xl shadow-[0_8px_24px_rgba(251,146,60,0.4)]"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          boxShadow: [
                            '0 8px 24px rgba(251,146,60,0.3)',
                            '0 10px 28px rgba(251,146,60,0.45)',
                            '0 8px 24px rgba(251,146,60,0.3)'
                          ]
                        }}
                        transition={{ 
                          delay: 0.6,
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <span className="text-[26px] font-black tracking-tighter">
                          Livraison 30-45min
                        </span>
                      </motion.div>
                    </div>

                    {/* Zone inférieure : CTA */}
                    <div className="flex-[0.3] flex items-start justify-center pt-2">
                      <motion.button
                        className="inline-flex items-center gap-2 px-10 py-3.5 bg-orange-400 text-white rounded-full font-black text-base shadow-[0_8px_24px_rgba(251,146,60,0.4)] border-2 border-orange-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: '0 12px 32px rgba(251,146,60,0.6)'
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Commander 🍕
                      </motion.button>
                    </div>

                    {/* Halo lumineux */}
                    <motion.div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-400/20 rounded-full blur-[80px] pointer-events-none"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.3, 0.2]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-3">
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
