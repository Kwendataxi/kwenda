import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Car, User, Clock } from 'lucide-react';

export const RentalPromoSlider = () => {
  const slides = [
    {
      id: '1',
      title: 'Location Flexible',
      subtitle: 'À partir de 35,000 CDF/jour',
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      icon: Car,
      cta: 'Voir les véhicules'
    },
    {
      id: '2',
      title: 'Avec ou sans chauffeur',
      subtitle: 'Vous choisissez !',
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      icon: User,
      cta: 'En savoir plus'
    },
    {
      id: '3',
      title: 'Disponible 24/7',
      subtitle: 'Réservez à tout moment',
      gradient: 'from-purple-500 via-pink-500 to-purple-600',
      icon: Clock,
      cta: 'Réserver maintenant'
    }
  ];

  return (
    <Carousel
      opts={{ loop: true }}
      plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
      className="w-full mb-6"
    >
      <CarouselContent>
        {slides.map((slide) => {
          const IconComponent = slide.icon;
          return (
            <CarouselItem key={slide.id}>
              <div className={`relative h-[140px] rounded-2xl overflow-hidden bg-gradient-to-br ${slide.gradient} p-6 flex items-center justify-between shadow-xl`}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
                
                {/* Contenu */}
                <div className="relative z-10 text-white space-y-2 flex-1">
                  <h3 className="text-2xl md:text-3xl font-black drop-shadow-lg">{slide.title}</h3>
                  <p className="text-sm md:text-base font-semibold opacity-90">{slide.subtitle}</p>
                  <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg">
                    {slide.cta}
                  </button>
                </div>
                
                {/* Icône décorative */}
                <div className="relative z-10 hidden sm:block">
                  <IconComponent className="h-20 w-20 text-white/30" />
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};
