import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceSlide } from '@/data/serviceWelcome';

interface ServiceWelcomeCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: ServiceSlide[];
  onNavigate: (path: string) => void;
}

export const ServiceWelcomeCarousel = ({
  open,
  onOpenChange,
  slides,
  onNavigate
}: ServiceWelcomeCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-play avec pause au hover
  useEffect(() => {
    if (!open || isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [open, isHovered, slides.length]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setCurrentSlide(0);
  }, [onOpenChange]);

  const handleCTA = useCallback(() => {
    const slide = slides[currentSlide];
    onNavigate(slide.ctaPath);
    handleClose();
  }, [currentSlide, slides, onNavigate, handleClose]);

  const slide = slides[currentSlide];
  const IconComponent = slide?.lucideIcon;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        className="h-[85vh] max-h-[700px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Hidden accessibility titles */}
        <DrawerTitle className="sr-only">Services Kwenda</DrawerTitle>
        <DrawerDescription className="sr-only">
          Découvrez tous nos services : Food, Shop, Transport et Loterie
        </DrawerDescription>

        {/* Skip Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-8 py-12 overflow-hidden">
          {/* Soft Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-b ${slide?.gradient || 'from-muted/30 to-background'} -z-10`} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center text-center max-w-xl"
            >
              {/* Animated Lucide Icon */}
              {IconComponent && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="mb-8"
                >
                  <IconComponent className="w-24 h-24 text-primary" strokeWidth={1.5} />
                </motion.div>
              )}

              {/* Title - Montserrat */}
              <h2 className="text-4xl font-bold font-montserrat mb-3 text-foreground">
                {slide?.title}
              </h2>

              {/* Subtitle - Montserrat Medium */}
              <p className="text-xl font-medium font-montserrat mb-6 text-primary">
                {slide?.subtitle}
              </p>

              {/* Description */}
              <p className="text-base text-muted-foreground leading-relaxed mb-12 max-w-md">
                {slide?.description}
              </p>

              {/* Dots Navigation */}
              <div className="flex gap-2 mb-10">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Aller au slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                onClick={handleCTA}
                className="w-full max-w-xs text-base font-semibold shadow-lg"
              >
                {slide?.ctaText || 'Découvrir'}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
