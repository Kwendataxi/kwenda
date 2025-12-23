import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
}

interface AddToCartFeedbackProps {
  onOpenCart?: () => void;
}

export const useAddToCartFeedback = ({ onOpenCart }: AddToCartFeedbackProps = {}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Animation produit vers panier simplifiée et fluide
  const animateItemToCart = (productElement: Element, cartButton: Element) => {
    const productRect = productElement.getBoundingClientRect();
    const cartRect = cartButton.getBoundingClientRect();

    // Image principale
    const flyingImage = document.createElement('div');
    flyingImage.style.position = 'fixed';
    flyingImage.style.left = `${productRect.left}px`;
    flyingImage.style.top = `${productRect.top}px`;
    flyingImage.style.width = `${productRect.width}px`;
    flyingImage.style.height = `${productRect.height}px`;
    flyingImage.style.zIndex = '9999';
    flyingImage.style.transition = 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    flyingImage.style.pointerEvents = 'none';
    flyingImage.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    
    const img = productElement.querySelector('img');
    if (img) {
      flyingImage.style.backgroundImage = `url(${img.src})`;
      flyingImage.style.backgroundSize = 'cover';
      flyingImage.style.backgroundPosition = 'center';
      flyingImage.style.borderRadius = '12px';
    }

    document.body.appendChild(flyingImage);

    // Trigger animation
    setTimeout(() => {
      flyingImage.style.left = `${cartRect.left}px`;
      flyingImage.style.top = `${cartRect.top}px`;
      flyingImage.style.width = '0px';
      flyingImage.style.height = '0px';
      flyingImage.style.opacity = '0';
      flyingImage.style.transform = 'scale(0.3) rotate(180deg)';
    }, 10);

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(flyingImage);
    }, 500);
  };

  // Confettis réduits et plus rapides
  const triggerLightConfetti = () => {
    const count = 25;
    const defaults = {
      origin: { x: 0.9, y: 0.1 },
      zIndex: 9999
    };

    const colors = [
      '#E8112d', // Rouge Congo
      '#F7D618', // Jaune Congo
      '#009543', // Vert Congo
      '#00A0DF', // Bleu Congo
      '#FF6B35', // Orange Kwenda
      '#F7931E', // Orange foncé
    ];

    confetti({
      ...defaults,
      particleCount: count,
      spread: 60,
      colors,
      ticks: 100,
      gravity: 1.3,
      scalar: 0.9,
      shapes: ['circle'],
      drift: 0.1
    });
  };

  // Toast moderne avec slide-up fluide
  const showAddToCartToast = (product: Product, quantity: number = 1) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30 
        }}
        className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden max-w-sm w-full backdrop-blur-md"
      >
        {/* Progress bar subtile */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 2.5, ease: "linear" }}
          className="h-0.5 bg-gradient-to-r from-primary to-green-500"
        />

        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Image produit */}
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-md"
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  className="p-1 bg-green-100 dark:bg-green-900/40 rounded-full"
                >
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </motion.div>
                <p className="font-semibold text-sm line-clamp-1 text-foreground">
                  {product.title}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Qté: {quantity}
                </p>
                <p className="text-sm font-bold text-primary">
                  {formatPrice(product.price * quantity)}
                </p>
              </div>
            </div>

            {/* Bouton panier */}
            {onOpenCart && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    toast.dismiss(t);
                    onOpenCart();
                  }}
                  className="h-9 px-3 rounded-xl hover:bg-primary/10"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    ), {
      duration: 2500,
      position: 'bottom-center',
      className: 'max-w-sm',
    });
  };

  // Fonction principale
  const showFeedback = (
    product: Product, 
    quantity: number = 1,
    options: {
      withAnimation?: boolean;
      withConfetti?: boolean;
      productElementSelector?: string;
      cartButtonSelector?: string;
    } = {}
  ) => {
    const {
      withAnimation = true,
      withConfetti = false,
      productElementSelector = `[data-product-id="${product.id}"]`,
      cartButtonSelector = '[data-cart-button]'
    } = options;

    // Toast
    showAddToCartToast(product, quantity);

    // Animation produit → panier
    if (withAnimation) {
      const productElement = document.querySelector(productElementSelector);
      const cartButton = document.querySelector(cartButtonSelector);
      
      if (productElement && cartButton) {
        animateItemToCart(productElement, cartButton);
      }
    }

    // Confettis (optionnel - pour premiers achats ou gros montants)
    if (withConfetti) {
      setTimeout(triggerLightConfetti, 100);
    }
  };

  return { showFeedback };
};

// Hook simple pour feedback basique
export const showSimpleAddToCartFeedback = (productName: string) => {
  toast.success(`${productName} ajouté au panier`, {
    position: 'bottom-center',
    duration: 3000,
  });
};
