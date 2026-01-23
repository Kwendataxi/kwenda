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
        className="h-auto max-h-[70vh]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Hidden accessibility titles */}
        <DrawerTitle className="sr-only">Services Kwenda</DrawerTitle>
        <DrawerDescription className="sr-only">
          Découvrez tous nos services : Food, Shop, Transport et Loterie
        </DrawerDescription>

        {/* Close Button - Glassmorphism */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-lg shadow-sm border border-border/40 flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
          {/* Subtle Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background -z-10" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center text-center max-w-sm"
            >
              {/* Icon in Soft Circle */}
              {IconComponent && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <IconComponent className="w-10 h-10 text-primary" strokeWidth={1.5} />
                  </div>
                </motion.div>
              )}

              {/* Title */}
              <h2 className="text-2xl font-bold font-montserrat mb-2 text-foreground">
                {slide?.title}
              </h2>

              {/* Subtitle */}
              <p className="text-base font-medium font-montserrat mb-4 text-primary">
                {slide?.subtitle}
              </p>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xs">
                {slide?.description}
              </p>

              {/* Dots Navigation */}
              <div className="flex gap-2 mb-6">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'w-6 bg-primary'
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
                className="w-full max-w-xs h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all active:scale-[0.98]"
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
