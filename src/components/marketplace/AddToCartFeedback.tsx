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

  // Animation produit vers panier
  const animateItemToCart = (productElement: Element, cartButton: Element) => {
    const productRect = productElement.getBoundingClientRect();
    const cartRect = cartButton.getBoundingClientRect();

    const flyingImage = document.createElement('div');
    flyingImage.style.position = 'fixed';
    flyingImage.style.left = `${productRect.left}px`;
    flyingImage.style.top = `${productRect.top}px`;
    flyingImage.style.width = `${productRect.width}px`;
    flyingImage.style.height = `${productRect.height}px`;
    flyingImage.style.zIndex = '9999';
    flyingImage.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    flyingImage.style.pointerEvents = 'none';
    
    const img = productElement.querySelector('img');
    if (img) {
      flyingImage.style.backgroundImage = `url(${img.src})`;
      flyingImage.style.backgroundSize = 'cover';
      flyingImage.style.backgroundPosition = 'center';
      flyingImage.style.borderRadius = '8px';
    }

    document.body.appendChild(flyingImage);

    // Trigger animation
    setTimeout(() => {
      flyingImage.style.left = `${cartRect.left}px`;
      flyingImage.style.top = `${cartRect.top}px`;
      flyingImage.style.width = '40px';
      flyingImage.style.height = '40px';
      flyingImage.style.opacity = '0';
    }, 10);

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(flyingImage);
    }, 650);
  };

  // Confettis légers
  const triggerLightConfetti = () => {
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { x: 0.9, y: 0.9 },
      colors: ['#FF6B35', '#F7931E', '#FFC857'],
      ticks: 100,
      gravity: 1.2,
      scalar: 0.8
    });
  };

  // Toast personnalisé avec actions
  const showAddToCartToast = (product: Product, quantity: number = 1) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card border-2 border-primary/20 rounded-lg shadow-2xl p-4 max-w-md w-full"
      >
        <div className="flex items-start gap-3">
          {/* Image produit */}
          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm line-clamp-1">{product.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ajouté au panier • Qté: {quantity}
                </p>
                <p className="text-sm font-bold text-primary mt-1">
                  {formatPrice(product.price * quantity)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              {onOpenCart && (
                <Button
                  size="sm"
                  onClick={() => {
                    toast.dismiss(t);
                    onOpenCart();
                  }}
                  className="flex-1"
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                  Voir panier
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toast.dismiss(t)}
                className="flex-1"
              >
                Continuer
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    ), {
      duration: 5000,
      position: 'bottom-center',
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
