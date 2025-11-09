import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ServiceSlide } from '@/data/serviceWelcome';

interface ServiceWelcomeCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: ServiceSlide[];
  onNavigate: (path: string) => void;
}

export const ServiceWelcomeCarousel: React.FC<ServiceWelcomeCarouselProps> = ({
  open,
  onOpenChange,
  slides,
  onNavigate
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleSkip = () => {
    onOpenChange(false);
  };

  const handleCTA = (path: string) => {
    onOpenChange(false);
    onNavigate(path);
  };

  const isLastSlide = selectedIndex === slides.length - 1;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] p-0 border-none">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-lg"
          aria-label="Passer l'introduction"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Carousel Container */}
        <div className="relative h-full overflow-hidden">
          <div className="embla h-full" ref={emblaRef}>
            <div className="embla__container h-full flex">
              {slides.map((slide, index) => (
                <div key={slide.id} className="embla__slide flex-[0_0_100%] min-w-0 relative">
                  <AnimatePresence mode="wait">
                    {selectedIndex === index && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full flex flex-col"
                      >
                        {/* Hero Image Section */}
                        <div className="relative h-[45%] overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-b ${slide.gradient}`} />
                          <img
                            src={slide.heroImage}
                            alt={slide.title}
                            className="w-full h-full object-cover mix-blend-overlay"
                          />
                          {/* Icon Badge */}
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 z-10"
                          >
                            <div className="w-16 h-16 rounded-2xl bg-background shadow-xl flex items-center justify-center text-4xl border-4 border-background">
                              {slide.icon}
                            </div>
                          </motion.div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 px-6 pt-12 pb-6 flex flex-col">
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mb-6"
                          >
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                              {slide.title}
                            </h2>
                            <p className="text-base font-semibold text-primary">
                              {slide.subtitle}
                            </p>
                          </motion.div>

                          <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm text-muted-foreground text-center mb-6 leading-relaxed"
                          >
                            {slide.description}
                          </motion.p>

                          {/* Features List */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-3 mb-8"
                          >
                            {slide.features.map((feature, i) => (
                              <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                                className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
                              >
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                  {feature}
                                </span>
                              </motion.div>
                            ))}
                          </motion.div>

                          {/* Navigation Dots */}
                          <div className="flex justify-center gap-2 mb-6">
                            {slides.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => scrollTo(idx)}
                                className={`h-2 rounded-full transition-all ${
                                  idx === selectedIndex
                                    ? 'w-8 bg-primary'
                                    : 'w-2 bg-muted-foreground/30'
                                }`}
                                aria-label={`Aller au slide ${idx + 1}`}
                              />
                            ))}
                          </div>

                          {/* CTA Button */}
                          <div className="flex gap-3">
                            {canScrollPrev && (
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={scrollPrev}
                                className="flex-1"
                              >
                                <ChevronLeft className="w-5 h-5 mr-2" />
                                Précédent
                              </Button>
                            )}
                            <Button
                              size="lg"
                              onClick={() => isLastSlide ? handleCTA(slide.ctaPath) : scrollNext()}
                              className="flex-1"
                            >
                              {isLastSlide ? slide.ctaText : 'Suivant'}
                              {!isLastSlide && <ChevronRight className="w-5 h-5 ml-2" />}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
