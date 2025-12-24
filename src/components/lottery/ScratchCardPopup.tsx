import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
} from '@/components/ui/drawer';
import { KwendaGrattaWin } from '@/types/kwenda-gratta';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScratchTicket } from './scratch/ScratchTicket';

interface ScratchCardPopupProps {
  card: KwendaGrattaWin | null;
  isOpen: boolean;
  onClose: () => void;
  onScratch: (percentage: number) => void;
  onReveal: () => void;
}

export const ScratchCardPopup: React.FC<ScratchCardPopupProps> = ({
  card,
  isOpen,
  onClose,
  onScratch,
  onReveal
}) => {
  const isMobile = useIsMobile();
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset revealed state when card changes
  useEffect(() => {
    if (card) {
      setIsRevealed(false);
    }
  }, [card?.id]);

  const handleReveal = () => {
    setIsRevealed(true);
    onReveal();
  };

  const handleClose = () => {
    setIsRevealed(false);
    onClose();
  };

  if (!card) return null;

  // Mobile: Use bottom sheet (Drawer)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerPortal>
          <DrawerOverlay />
          <DrawerContent className="max-h-[85dvh] pb-8">
            <DrawerHandle />
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                🎟️ Votre ticket à gratter
              </h2>
              {isRevealed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Ticket content */}
            <div className="px-4 py-6 overflow-y-auto">
              <ScratchTicket
                card={card}
                onScratch={onScratch}
                onReveal={handleReveal}
                onClose={handleClose}
              />
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    );
  }

  // Desktop: Centered modal
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={isRevealed ? handleClose : undefined}
          />

          {/* Modal container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                🎟️ Votre ticket à gratter
              </h2>
              {isRevealed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Ticket content */}
            <div className="p-5">
              <ScratchTicket
                card={card}
                onScratch={onScratch}
                onReveal={handleReveal}
                onClose={handleClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
