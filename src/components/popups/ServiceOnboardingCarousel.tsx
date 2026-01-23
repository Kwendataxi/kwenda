import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export type ServiceType = 'lottery' | 'food' | 'wallet' | 'rental';

interface OnboardingSlide {
  title: string;
  description: string;
  image?: string;
  icon?: React.ReactNode;
}

interface ServiceOnboardingCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceType;
  onComplete: () => void;
}

const serviceSlides: Record<ServiceType, OnboardingSlide[]> = {
  lottery: [
    {
      title: 'Bienvenue dans la Tombola ! 🎟️',
      description: 'Participez gratuitement et gagnez des récompenses en crédits KwendaPay.'
    },
    {
      title: 'Gagnez des tickets',
      description: 'Recevez des tickets gratuits à chaque course, livraison ou parrainage réussi.'
    },
    {
      title: 'Tirages quotidiens',
      description: 'Des tirages automatiques chaque jour. Plus vous avez de tickets, plus vous avez de chances !'
    }
  ],
  food: [
    {
      title: 'Découvrez Food 🍔',
      description: 'Commandez vos plats préférés dans les meilleurs restaurants de votre ville.'
    },
    {
      title: 'Livraison rapide',
      description: 'Suivi en temps réel de votre commande, de la cuisine à votre porte.'
    },
    {
      title: 'Personnalisez vos plats',
      description: 'Choisissez la taille, les extras et ajoutez des instructions spéciales.'
    }
  ],
  wallet: [
    {
      title: 'KwendaPay Wallet 💰',
      description: 'Votre portefeuille électronique pour tous vos paiements sur Kwenda.'
    },
    {
      title: 'Rechargez facilement',
      description: 'Utilisez Orange Money, M-Pesa, Airtel Money ou votre carte bancaire.'
    },
    {
      title: 'Payez en un clic',
      description: 'Plus besoin de chercher de l\'argent liquide. Payez instantanément avec votre wallet.'
    }
  ],
  rental: [
    {
      title: 'Location de véhicules 🚗',
      description: 'Louez des véhicules de qualité pour vos déplacements personnels ou professionnels.'
    },
    {
      title: 'Large choix',
      description: 'Berlines, SUV, véhicules utilitaires... Trouvez le véhicule adapté à vos besoins.'
    },
    {
      title: 'Assurance incluse',
      description: 'Tous nos véhicules sont assurés tous risques pour votre sécurité.'
    }
  ]
};

export const ServiceOnboardingCarousel = ({
  open,
  onOpenChange,
  service,
  onComplete
}: ServiceOnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = serviceSlides[service];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
    setCurrentSlide(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Slides */}
        <div className="relative h-[500px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              {/* Icon/Image */}
              <div className="mb-8 text-6xl">
                {slides[currentSlide].icon || '✨'}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-4">
                {slides[currentSlide].title}
              </h2>

              {/* Description */}
              <p className="text-muted-foreground mb-8 max-w-md">
                {slides[currentSlide].description}
              </p>

              {/* Dots */}
              <div className="flex gap-2 mb-8">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'w-8 bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Button */}
              <Button
                size="lg"
                onClick={handleNext}
                className="w-full max-w-xs text-base font-semibold"
              >
                {currentSlide < slides.length - 1 ? (
                  <>
                    Suivant
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  'Commencer 🚀'
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
