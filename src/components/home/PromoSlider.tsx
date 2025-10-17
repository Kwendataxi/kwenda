import { useEffect, useState, useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { defaultPromos } from '@/data/promos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShoppingBag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { FloatingParticles } from '@/components/wallet/FloatingParticles';

interface PromoSliderProps {
  onServiceSelect: (service: string) => void;
}

export const PromoSlider = ({ onServiceSelect }: PromoSliderProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') api?.scrollPrev();
      if (e.key === 'ArrowRight') api?.scrollNext();
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [api]);

  // Touch gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => api?.scrollNext(),
    onSwipedRight: () => api?.scrollPrev(),
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10
  });

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
    <div className="w-full h-[220px] sm:h-[260px] md:h-[300px] relative" {...swipeHandlers}>
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: 'start' }}
        plugins={[autoplayRef.current]}
        className="w-full h-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4 h-full scroll-smooth">
          {defaultPromos.map((promo, index) => (
            <CarouselItem key={promo.id} className="pl-2 md:pl-4 h-full scroll-snap-align-center">
              <motion.div
                onClick={() => handlePromoClick(promo)}
                className={cn(
                  'relative h-full rounded-2xl overflow-hidden cursor-pointer group',
                  'bg-gradient-to-br shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
                  promo.gradient
                )}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: current === index ? 1 : 0.7,
                  scale: current === index ? 1 : 0.95,
                }}
                whileHover={{ 
                  scale: 1.02,
                  rotateY: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  transition: { duration: 0.3 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Ken Burns Background Animation */}
                <motion.div
                  className={cn('absolute inset-0 bg-gradient-to-br', promo.gradient)}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                {/* Floating Particles */}
                <FloatingParticles color="primary-foreground" count={12} />
                {/* Overlay gradients sophistiqués */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_60%)] z-10" />
                
                {/* Slide 1: 30% Discount */}
                {promo.id === '1' && (
                  <div className="absolute inset-0 p-4 sm:p-6 flex items-center justify-between text-white z-20">
                    {/* Contenu gauche */}
                    <motion.div 
                      className="flex-1"
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <motion.h3 
                        className="text-3xl sm:text-4xl md:text-5xl font-black drop-shadow-2xl leading-none mb-1.5 -rotate-1"
                        whileHover={{ scale: 1.05, rotate: 0 }}
                      >
                        30% OFF
                      </motion.h3>
                      <p className="text-sm sm:text-base font-bold opacity-95 drop-shadow-lg mb-3">
                        sur ta 1ère course 🎉
                      </p>
                      
                      {/* CTA Button */}
                      <motion.div 
                        className="inline-block bg-white text-primary px-5 py-2 rounded-xl font-black text-xs sm:text-sm shadow-xl"
                        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {promo.cta} →
                      </motion.div>
                    </motion.div>

                    {/* Badge promo à droite */}
                    <motion.div 
                      className="bg-yellow-400 text-black px-3 py-1 rounded-full font-black text-xs shadow-xl rotate-3"
                      animate={{ rotate: [3, -3, 3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {promo.description}
                    </motion.div>

                    {/* Déco circles */}
                    <motion.div 
                      className="absolute bottom-4 right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/20 rounded-full blur-2xl"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                )}

                {/* Slide 2: Flash Express Delivery - Modern & Clean */}
                {promo.id === '2' && (
                  <div className="absolute inset-0 p-3 sm:p-5 flex flex-col text-white z-20">
                    {/* Header with badge + lightning icon */}
                    <div className="flex items-start justify-between mb-2">
                      <motion.div 
                        className="bg-black/40 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full font-black text-[9px] sm:text-xs shadow-lg border border-white/20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        EXPRESS
                      </motion.div>
                      <motion.div
                        animate={{ 
                          rotate: [0, -10, 10, 0],
                          filter: ['drop-shadow(0 0 15px rgba(253,224,71,0.6))', 'drop-shadow(0 0 25px rgba(253,224,71,0.9))', 'drop-shadow(0 0 15px rgba(253,224,71,0.6))']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap 
                          className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-300" 
                          fill="currentColor" 
                          strokeWidth={0}
                        />
                      </motion.div>
                    </div>

                    {/* Main content - centered and compact */}
                    <div className="flex-1 flex flex-col justify-center relative z-10 -mt-2">
                      <motion.h3 
                        className="text-2xl sm:text-3xl md:text-4xl font-black drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] leading-none tracking-tighter mb-0.5 bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent"
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Livrez Rapide
                      </motion.h3>
                      <motion.h3 
                        className="text-2xl sm:text-3xl md:text-4xl font-black drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] leading-none tracking-tighter bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent"
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        en Flash
                      </motion.h3>
                    </div>

                    {/* Footer with timing + CTA - compact */}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div className="text-[10px] sm:text-xs font-bold bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                        30 min
                      </div>
                      
                      <motion.div 
                        className="inline-flex items-center gap-1 px-4 py-1.5 sm:px-6 sm:py-2 bg-white text-orange-600 rounded-xl font-black text-[11px] sm:text-sm shadow-[0_4px_15px_rgba(255,255,255,0.3)]"
                        whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(255,255,255,0.4)' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {promo.cta} →
                      </motion.div>
                    </div>

                    {/* Enhanced glow effects - animated */}
                    <motion.div 
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-28 h-28 sm:w-40 sm:h-40 bg-yellow-400/40 rounded-full blur-3xl pointer-events-none"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute top-1/2 -translate-y-1/2 right-6 w-20 h-20 sm:w-32 sm:h-32 bg-orange-400/30 rounded-full blur-2xl pointer-events-none"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    />
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

                {/* Slide 4: Car Rental - Modern & Clean */}
                {promo.id === '4' && (
                  <div className="absolute inset-0 p-3 flex items-center justify-between text-white">
                    {/* Left side - Icon + Content */}
                    <div className="flex items-center gap-2.5 flex-1">
                      {/* Car icon - compact */}
                      <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center">
                        <span className="text-xl">🚗</span>
                      </div>

                      {/* Title + Price - compact */}
                      <div>
                        <h3 className="text-base font-black drop-shadow-lg leading-tight tracking-tight mb-0.5">
                          Location de véhicules
                        </h3>
                        
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black drop-shadow-lg">50 000 CDF</span>
                          <span className="text-[9px] font-medium opacity-75">/jour</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA Button - compact */}
                    <div className="flex-shrink-0">
                      <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/40 rounded-xl font-bold text-[11px] hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap">
                        {promo.cta} →
                      </div>
                    </div>

                    {/* Subtle glow effects */}
                    <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/3 left-1/4 w-16 h-16 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                  </div>
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
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Pagination dots - Enhanced avec progression animée */}
        <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
          {defaultPromos.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'relative h-3 rounded-full overflow-hidden transition-all duration-300',
                current === index ? 'w-12' : 'w-3'
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-muted-foreground/30" />
              
              {/* Progress bar active */}
              {current === index && (
                <motion.div
                  className="absolute inset-0 bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  key={`progress-${index}`}
                />
              )}
            </motion.button>
          ))}
        </div>
      </Carousel>
    </div>
  );
};
