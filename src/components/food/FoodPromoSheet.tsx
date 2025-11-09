import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ArrowRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

export interface FoodPromoOffer {
  id: string;
  restaurant_name: string;
  restaurant_logo?: string;
  product_name: string;
  product_image: string;
  original_price: number;
  promo_price: number;
  promo_code: string;
  description: string;
  background_gradient?: string;
  expiry_date?: string;
}

interface FoodPromoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: FoodPromoOffer;
  onOrder: (promoCode: string) => void;
}

export function FoodPromoSheet({ open, onOpenChange, offer, onOrder }: FoodPromoSheetProps) {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toast } = useToast();

  // ✅ LOG DE DEBUG
  console.log('🎁 [FoodPromoSheet] Rendered:', {
    open,
    offerName: offer.product_name,
    offerRestaurant: offer.restaurant_name,
    promoCode: offer.promo_code
  });

  const discountPercentage = Math.round(
    ((offer.original_price - offer.promo_price) / offer.original_price) * 100
  );

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(offer.promo_code);
    setCopied(true);
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#f97316', '#fb923c', '#fdba74'],
      ticks: 100,
      gravity: 1.2,
      scalar: 0.8
    });
    
    toast({
      title: "✓ Code copié",
      description: "Utilisez-le lors de votre commande",
      duration: 2000,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOrder = () => {
    handleCopyCode();
    setTimeout(() => {
      onOrder(offer.promo_code);
      onOpenChange(false);
    }, 300);
  };

  const gradientClass = offer.background_gradient || 'from-orange-500 via-amber-500 to-yellow-500';

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal>
      <DrawerContent className="max-h-[90vh] rounded-t-[2rem] border-0 shadow-2xl overflow-hidden bg-background z-[100]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
          className="max-w-lg mx-auto w-full"
        >
          {/* Close Button */}
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>

          {/* Accessibility - Required by Vaul */}
          <DrawerTitle className="sr-only">{offer.product_name}</DrawerTitle>
          <DrawerDescription className="sr-only">{offer.description}</DrawerDescription>

          {/* Hero Image Section */}
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
            
            {/* Product Image */}
            <img
              src={offer.product_image}
              alt={offer.product_name}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90"
              onError={(e) => {
                console.warn('❌ [FoodPromoSheet] Image failed:', offer.product_image);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ [FoodPromoSheet] Image loaded:', offer.product_image);
                setImageLoaded(true);
              }}
            />

            {/* Restaurant Logo - Top Left */}
            {offer.restaurant_logo && (
              <div className="absolute top-4 left-4 w-16 h-16 rounded-2xl bg-white shadow-lg p-2 backdrop-blur-sm">
                <img
                  src={offer.restaurant_logo}
                  alt={offer.restaurant_name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Discount Badge - Top Right */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-xl font-black text-xl"
            >
              -{discountPercentage}%
            </motion.div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>

          {/* Content Section */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Restaurant & Product Name */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {offer.restaurant_name}
              </h3>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">
                {offer.product_name}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {offer.description}
              </p>
            </div>

            {/* Price Section */}
            <div className="flex items-end gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground line-through">
                  {offer.original_price.toLocaleString()} CDF
                </span>
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {offer.promo_price.toLocaleString()} CDF
                </span>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Code promo à utiliser
              </p>
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyCode}
                  className="w-full bg-muted hover:bg-muted/80 rounded-2xl p-4 flex items-center justify-between transition-colors group"
                >
                  <span className="text-xl sm:text-2xl font-mono font-black tracking-wider text-foreground">
                    {offer.promo_code}
                  </span>
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="text-green-600"
                        >
                          <Check className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="text-muted-foreground group-hover:text-foreground transition-colors"
                        >
                          <Copy className="h-5 w-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* CTA Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleOrder}
                size="lg"
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-lg shadow-lg shadow-orange-500/25"
              >
                Commander maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Expiry Info */}
            {offer.expiry_date && (
              <p className="text-center text-xs text-muted-foreground">
                Valide jusqu'au {new Date(offer.expiry_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
