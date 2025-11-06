import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import useEmblaCarousel from 'embla-carousel-react';

interface MarketplaceImageGalleryProps {
  images: string[];
  productTitle: string;
}

export const MarketplaceImageGallery: React.FC<MarketplaceImageGalleryProps> = ({
  images,
  productTitle
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true
  });

  const safeImages = images.length > 0 ? images : ['/placeholder.svg'];

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onThumbClick = React.useCallback((index: number) => {
    if (!emblaApi || !emblaThumbsApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi, emblaThumbsApi]);

  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="space-y-3">
      {/* Main Gallery */}
      <div className="relative group">
        <div className="overflow-hidden rounded-2xl bg-muted" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {safeImages.map((image, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0">
                <div className="relative aspect-[4/3] sm:aspect-square">
                  <img
                    src={image}
                    alt={`${productTitle} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  
                  {/* Fullscreen button */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows - Desktop */}
        {safeImages.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Dots Indicator - Mobile */}
        {safeImages.length > 1 && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {safeImages.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === selectedIndex 
                    ? 'w-6 bg-primary' 
                    : 'w-1.5 bg-white/60'
                }`}
                onClick={() => onThumbClick(index)}
              />
            ))}
          </div>
        )}

        {/* Image Counter Badge */}
        <Badge className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm">
          {selectedIndex + 1} / {safeImages.length}
        </Badge>
      </div>

      {/* Thumbnails - Desktop */}
      {safeImages.length > 1 && (
        <div className="hidden sm:block overflow-hidden" ref={emblaThumbsRef}>
          <div className="flex gap-2">
            {safeImages.map((image, index) => (
              <button
                key={index}
                className={`flex-[0_0_20%] sm:flex-[0_0_15%] lg:flex-[0_0_12%] min-w-0 rounded-lg overflow-hidden transition-all ${
                  index === selectedIndex 
                    ? 'ring-2 ring-primary opacity-100' 
                    : 'opacity-60 hover:opacity-100'
                }`}
                onClick={() => onThumbClick(index)}
              >
                <div className="aspect-square">
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            <img
              src={safeImages[selectedIndex]}
              alt={`${productTitle} - Fullscreen`}
              className="max-w-full max-h-full object-contain"
            />

            {safeImages.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                  onClick={scrollPrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                  onClick={scrollNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
