import { useEffect, useRef, memo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ResponsiveImage } from '@/components/common/ResponsiveImage';

// Mêmes images que la landing page
import campaignClient from '@/assets/campaign-client.png';
import campaignDelivery from '@/assets/campaign-delivery.png';

interface PromoSliderProps {
  onServiceSelect?: (service: string) => void;
}

const slides = [
  {
    id: 1,
    image: campaignClient,
    alt: 'Kwenda - Simplifiez vos trajets, profitez de chaque instant',
  },
  {
    id: 2,
    image: campaignDelivery,
    alt: 'Devenez livreur Kwenda et gagnez plus rapidement',
  }
];

const PromoSliderOptimized = memo(({ onServiceSelect }: PromoSliderProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'center',
      skipSnaps: false,
      duration: 30,
    },
    [Autoplay({ 
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      playOnInit: true,
    })]
  );

  // Watchdog pour s'assurer que l'autoplay reste actif
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = emblaApi.plugins()?.autoplay;
    
    const checkAutoplay = () => {
      if (autoplay && typeof autoplay.play === 'function' && !autoplay.isPlaying?.()) {
        autoplay.play();
      }
    };

    const watchdogInterval = setInterval(checkAutoplay, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden && autoplay && typeof autoplay.play === 'function') {
        autoplay.play();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(watchdogInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [emblaApi]);

  return (
    <div className="w-full relative mb-6 mx-auto max-w-7xl z-10 px-3">
      {/* Container épuré avec coins arrondis */}
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative"
            >
              {/* Image Container avec aspect ratio 16:9 */}
              <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl">
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/20 shadow-md">
                  <ResponsiveImage
                    src={slide.image}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    width={800}
                    height={450}
                    widths={[400, 600, 800]}
                    sizes="(max-width: 768px) 100vw, 800px"
                    useWebP={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

PromoSliderOptimized.displayName = 'PromoSliderOptimized';

export { PromoSliderOptimized as PromoSlider };
