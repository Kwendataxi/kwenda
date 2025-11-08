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

  // Animation produit vers panier améliorée avec trail effect
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
    flyingImage.style.transition = 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
    flyingImage.style.pointerEvents = 'none';
    flyingImage.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
    
    const img = productElement.querySelector('img');
    if (img) {
      flyingImage.style.backgroundImage = `url(${img.src})`;
      flyingImage.style.backgroundSize = 'cover';
      flyingImage.style.backgroundPosition = 'center';
      flyingImage.style.borderRadius = '12px';
    }

    document.body.appendChild(flyingImage);

    // Trail effect - particules qui suivent
    const trailCount = 5;
    const trails: HTMLDivElement[] = [];
    for (let i = 0; i < trailCount; i++) {
      const trail = document.createElement('div');
      trail.style.position = 'fixed';
      trail.style.left = `${productRect.left + productRect.width / 2}px`;
      trail.style.top = `${productRect.top + productRect.height / 2}px`;
      trail.style.width = '8px';
      trail.style.height = '8px';
      trail.style.borderRadius = '50%';
      trail.style.background = `linear-gradient(45deg, hsl(var(--primary)), hsl(var(--orange-500)))`;
      trail.style.zIndex = '9998';
      trail.style.pointerEvents = 'none';
      trail.style.opacity = String(0.8 - i * 0.15);
      trail.style.transition = `all ${0.7 + i * 0.1}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
      trail.style.boxShadow = '0 0 10px hsl(var(--primary) / 0.5)';
      document.body.appendChild(trail);
      trails.push(trail);
    }

    // Trigger animation avec bounce à l'arrivée
    setTimeout(() => {
      flyingImage.style.left = `${cartRect.left}px`;
      flyingImage.style.top = `${cartRect.top}px`;
      flyingImage.style.width = '0px';
      flyingImage.style.height = '0px';
      flyingImage.style.opacity = '0';
      flyingImage.style.transform = 'scale(0) rotate(360deg)';

      // Animer les trails
      trails.forEach((trail, i) => {
        setTimeout(() => {
          trail.style.left = `${cartRect.left + cartRect.width / 2}px`;
          trail.style.top = `${cartRect.top + cartRect.height / 2}px`;
          trail.style.opacity = '0';
          trail.style.transform = 'scale(0)';
        }, i * 50);
      });
    }, 10);

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(flyingImage);
      trails.forEach(trail => document.body.removeChild(trail));
    }, 900);
  };

  // Confettis améliorés avec couleurs Congo et formes variées
  const triggerLightConfetti = () => {
    const count = 50;
    const defaults = {
      origin: { x: 0.9, y: 0.1 },
      zIndex: 9999
    };

    // Couleurs du drapeau congolais + orange Kwenda
    const colors = [
      '#E8112d', // Rouge Congo
      '#F7D618', // Jaune Congo
      '#009543', // Vert Congo
      '#00A0DF', // Bleu Congo
      '#FF6B35', // Orange Kwenda
      '#F7931E', // Orange foncé
    ];

    // Premier burst - confettis variés
    confetti({
      ...defaults,
      particleCount: count / 2,
      spread: 70,
      colors,
      ticks: 150,
      gravity: 1,
      scalar: 1,
      shapes: ['circle', 'square'],
      drift: 0.2
    });

    // Second burst décalé - étoiles
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: count / 2,
        spread: 90,
        colors,
        ticks: 120,
        gravity: 1.2,
        scalar: 0.8,
        shapes: ['star'],
        startVelocity: 45,
      });
    }, 150);
  };

  // Toast moderne avec image produit et progress bar
  const showAddToCartToast = (product: Product, quantity: number = 1) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-card border-2 border-primary/30 rounded-xl shadow-2xl overflow-hidden max-w-md w-full backdrop-blur-sm"
      >
        {/* Progress bar animée */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 5, ease: "linear" }}
          className="h-1 bg-gradient-to-r from-primary via-orange-500 to-primary"
          style={{ 
            background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--orange-500)), hsl(var(--primary)))',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite'
          }}
        />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Image produit arrondie 40x40 */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-md ring-2 ring-primary/20">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full"
                >
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-bold text-sm line-clamp-1 text-foreground">
                    🎉 {product.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ajouté au panier • Quantité: {quantity}
                  </p>
                  <p className="text-base font-bold text-primary mt-1">
                    {formatPrice(product.price * quantity)}
                  </p>
                </div>
              </div>

              {/* Actions avec badge nombre d'items */}
              <div className="flex gap-2 mt-3">
                {onOpenCart && (
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.dismiss(t);
                      onOpenCart();
                    }}
                    className="flex-1 font-semibold shadow-md hover:shadow-lg transition-shadow"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    Voir le panier
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.dismiss(t)}
                  className="flex-shrink-0 px-4"
                >
                  Continuer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ), {
      duration: 5000,
      position: 'bottom-right',
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
