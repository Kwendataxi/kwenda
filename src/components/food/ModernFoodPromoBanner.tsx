import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Zap, Percent } from 'lucide-react';

interface PromoSlide {
  id: string;
  title: string;
  description: string;
  cta: string;
  gradient: string;
  icon: React.ReactNode;
}

const promoSlides: PromoSlide[] = [
  {
    id: 'welcome',
    title: '🎉 Bienvenue chez Kwenda Food',
    description: 'Livraison gratuite sur votre 1ère commande',
    cta: 'Commencer',
    gradient: 'from-violet-500 via-purple-500 to-indigo-600',
    icon: <Sparkles className="w-8 h-8" />
  },
  {
    id: 'fast',
    title: '⚡ Livraison Express',
    description: 'Vos plats en moins de 30 minutes',
    cta: 'Commander',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    icon: <Zap className="w-8 h-8" />
  },
  {
    id: 'discount',
    title: '💰 -20% cette semaine',
    description: 'Sur tous les restaurants partenaires',
    cta: 'Profiter',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    icon: <Percent className="w-8 h-8" />
  }
];

export const ModernFoodPromoBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = promoSlides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-3xl mx-4 mt-4">
      {/* Gradient animé de fond */}
      <motion.div
        key={slide.id}
        className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ 
          opacity: { duration: 0.5 },
          backgroundPosition: { duration: 10, repeat: Infinity }
        }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
            }}
          />
        ))}
      </div>
      
      {/* Contenu avec glassmorphism */}
      <div className="relative backdrop-blur-sm bg-white/10 p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {slide.title}
              </motion.h2>
              <motion.p 
                className="text-white/95 text-lg mb-4 drop-shadow-md"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {slide.description}
              </motion.p>
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-xl"
                >
                  {slide.cta}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </motion.div>
            </div>

            {/* Icône décorative */}
            <motion.div
              className="hidden md:flex items-center justify-center w-20 h-20 rounded-full bg-white/20 text-white"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              {slide.icon}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Indicateurs de slides */}
        <div className="flex gap-2 mt-4 justify-center">
          {promoSlides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide 
                  ? 'w-8 bg-white' 
                  : 'w-1.5 bg-white/40'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
