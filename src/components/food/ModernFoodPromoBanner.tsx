import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Zap, Percent, Gift, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  gradient: string;
  accentColor: string;
  icon: React.ReactNode;
  emoji: string;
  bgImage?: string;
}

const promoSlides: PromoSlide[] = [
  {
    id: 'welcome',
    title: 'Bienvenue',
    subtitle: 'chez Kwenda Food',
    description: 'Livraison GRATUITE sur votre 1ère commande',
    cta: 'Commencer maintenant',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    accentColor: 'violet',
    icon: <Sparkles className="w-6 h-6" />,
    emoji: '🎉',
  },
  {
    id: 'fast',
    title: 'Livraison',
    subtitle: 'Ultra Express',
    description: 'Vos plats chauds en moins de 30 minutes',
    cta: 'Commander',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    accentColor: 'orange',
    icon: <Zap className="w-6 h-6" />,
    emoji: '⚡',
  },
  {
    id: 'discount',
    title: '-20%',
    subtitle: 'Cette semaine',
    description: 'Sur tous les restaurants partenaires',
    cta: 'Profiter',
    gradient: 'from-rose-500 via-pink-500 to-red-500',
    accentColor: 'rose',
    icon: <Percent className="w-6 h-6" />,
    emoji: '💰',
  },
  {
    id: 'rewards',
    title: 'Programme',
    subtitle: 'Fidélité VIP',
    description: 'Gagnez des points à chaque commande',
    cta: 'Découvrir',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    accentColor: 'emerald',
    icon: <Gift className="w-6 h-6" />,
    emoji: '🎁',
  }
];

// Floating food emojis pour l'ambiance
const floatingEmojis = ['🍕', '🍔', '🍗', '🍜', '🥗', '🍣', '🌮', '🍩'];

export const ModernFoodPromoBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const slide = promoSlides[currentSlide];

  return (
    <motion.div 
      className="relative overflow-hidden rounded-3xl mx-4 mt-4 min-h-[200px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient animé */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className={cn("absolute inset-0 bg-gradient-to-br", slide.gradient)}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Floating food emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingEmojis.slice(0, 5).map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl opacity-20"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '120%',
              rotate: Math.random() * 360 
            }}
            animate={{ 
              y: '-20%',
              rotate: Math.random() * 360 + 360,
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'linear'
            }}
            style={{ left: `${10 + i * 20}%` }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Glow effects */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/15 rounded-full blur-2xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />

      {/* Contenu principal avec glassmorphism */}
      <div className="relative p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center justify-between gap-6"
          >
            {/* Texte */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Badge emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <span className="text-xl">{slide.emoji}</span>
                <span className="text-white/90 text-sm font-semibold">Offre spéciale</span>
              </motion.div>

              {/* Titre principal */}
              <div>
                <motion.h2 
                  className="text-3xl md:text-4xl font-black text-white leading-tight"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {slide.title}
                </motion.h2>
                <motion.h3 
                  className="text-2xl md:text-3xl font-bold text-white/90"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {slide.subtitle}
                </motion.h3>
              </div>

              {/* Description */}
              <motion.p 
                className="text-white/85 text-base md:text-lg font-medium max-w-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {slide.description}
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <Button 
                  size="lg" 
                  className={cn(
                    "bg-white hover:bg-white/95 font-bold shadow-2xl shadow-black/20",
                    "text-gray-900 px-6 py-3 rounded-xl",
                    "transform transition-all duration-300 hover:scale-105"
                  )}
                >
                  {slide.cta}
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </motion.div>
                </Button>
              </motion.div>
            </div>

            {/* Icône décorative avec glassmorphism */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              className="hidden md:flex"
            >
              <div className="relative">
                <motion.div
                  className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    y: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <span className="text-5xl">{slide.emoji}</span>
                </motion.div>
                
                {/* Orbiting icon */}
                <motion.div
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  {slide.icon}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Progress indicators */}
        <div className="flex gap-2 mt-6 justify-center">
          {promoSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
              style={{ width: index === currentSlide ? 32 : 8 }}
            >
              <div className="absolute inset-0 bg-white/30" />
              {index === currentSlide && (
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 6, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
