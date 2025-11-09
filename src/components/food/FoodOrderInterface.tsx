import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantsQuery } from '@/hooks/useRestaurantsQuery';
import { useFoodCart } from '@/hooks/useFoodCart';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantList } from './RestaurantList';
import { RestaurantStoreView } from './RestaurantStoreView';
import { FoodCheckout } from './FoodCheckout';
import { OrderSuccessModal } from './OrderSuccessModal';
import { KwendaFoodHeader } from './KwendaFoodHeader';
import { AllDishesView } from './AllDishesView';
import { AllRestaurantsView } from './AllRestaurantsView';
import { FoodFooterNav } from './FoodFooterNav';
import { FoodCart } from './FoodCart';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';

type Step = 'restaurants' | 'menu' | 'checkout' | 'all-dishes' | 'all-restaurants';

interface FoodOrderInterfaceProps {
  onOrderComplete?: (orderId: string) => void;
  onBack?: () => void;
}

export const FoodOrderInterface = ({ onOrderComplete, onBack }: FoodOrderInterfaceProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [step, setStep] = useState<Step>('restaurants');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [showCartSheet, setShowCartSheet] = useState(false);
  const { restaurants, loading, refetch } = useRestaurantsQuery(selectedCity);
  const { cart, setCart, clearCart } = useFoodCart(selectedRestaurant?.id);



  // Vider l'affichage du panier seulement si on retourne à la liste ET qu'il est vide
  useEffect(() => {
    if (!selectedRestaurant && step === 'restaurants' && cart.length === 0) {
      // Ne rien faire - le panier est déjà vide
    }
    // Ne pas vider le panier automatiquement quand on change de vue
  }, [selectedRestaurant, step, cart.length]);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setStep('menu');
  };

  const handleAddToCart = (product: FoodProduct, quantity: number = 1, notes?: string) => {
    // Vérifier si panier non vide et restaurant différent
    if (cart.length > 0 && cart[0].restaurant_id !== product.restaurant_id) {
      toast.error('Vous avez déjà des articles d\'un autre restaurant', {
        description: 'Videz votre panier ou terminez votre commande avant d\'ajouter des plats d\'un autre restaurant',
        action: {
          label: 'Vider le panier',
          onClick: () => {
            clearCart();
            toast.success('Panier vidé', {
              description: 'Vous pouvez maintenant ajouter ce plat'
            });
          }
        }
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity, notes }
            : item
        );
      }
      
      return [...prevCart, { ...product, quantity, notes }];
    });

    // Confetti animation
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#FFA500', '#FF6347', '#FFD700']
    });

    toast.success(t('food.added_to_cart', { product: product.name }));

    // Si on est dans "Tous les plats", naviguer vers le restaurant après ajout
    if (!selectedRestaurant && step === 'all-dishes') {
      const restaurant = restaurants.find(r => r.id === product.restaurant_id);
      if (restaurant) {
        setTimeout(() => {
          setSelectedRestaurant(restaurant);
          setStep('menu');
          toast.success('Redirection vers le restaurant', {
            description: `Vous pouvez continuer à commander chez ${restaurant.restaurant_name}`
          });
        }, 1000);
      }
    }
  };

  const handleUpdateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handlePlaceOrder = async (deliveryAddress: string, paymentMethod: 'kwenda_pay' | 'cash') => {
    if (!selectedRestaurant || !user) return;

    try {
      const orderData = {
        restaurant_id: selectedRestaurant.id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          special_instructions: item.notes || ''
        })),
        delivery_address: deliveryAddress,
        delivery_phone: user.phone || '',
        payment_method: paymentMethod
      };

      const { data, error } = await supabase.functions.invoke('food-order-processor', {
        body: orderData
      });

      if (error) {
        // Parse error pour afficher les détails du solde
        const errorData = error.context?.body;
        
        if (errorData?.error === 'insufficient_funds') {
          toast.error('Solde insuffisant', {
            description: `Requis: ${formatCurrency(errorData.required, 'CDF')} | Disponible: ${formatCurrency(errorData.available, 'CDF')} (Bonus: ${formatCurrency(errorData.bonus, 'CDF')} | Principal: ${formatCurrency(errorData.main, 'CDF')})`
          });
        } else {
          toast.error('Erreur de paiement', {
            description: error.message || 'Veuillez réessayer'
          });
        }
        throw error;
      }

      toast.success(t('food.order_success'), {
        description: t('food.order_number', { number: data.order_number })
      });

      setLastOrderNumber(data.order_number);
      setSuccessModalOpen(true);
      clearCart();
      
      if (onOrderComplete && data.order_id) {
        onOrderComplete(data.order_id);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(t('food.order_error'), {
        description: error.message || t('food.please_retry')
      });
    }
  };

  const handleBack = () => {
    if (step === 'checkout') {
      setStep('menu');
    } else if (step === 'menu') {
      setStep('restaurants');
      setSelectedRestaurant(null);
    } else if (step === 'all-dishes' || step === 'all-restaurants') {
      setStep('restaurants');
    } else if (onBack) {
      onBack();
    }
  };

  const handleBackToHome = () => {
    navigate('/app/client');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2000; // Fixed delivery fee for now
  const serviceFee = subtotal * 0.05; // 5% service fee
  const total = subtotal + deliveryFee + serviceFee;

  return (
    <motion.div 
      className="h-full flex flex-col bg-background pb-20 md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <KwendaFoodHeader
        step={step}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        selectedRestaurant={selectedRestaurant}
        cartItemsCount={cart.length}
        onBack={handleBack}
        onBackToHome={handleBackToHome}
        onCartClick={() => setShowCartSheet(true)}
      />

      {/* Content with Animations */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="sync">
          {step === 'restaurants' && (
            <motion.div
              key="restaurants"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <RestaurantList
                restaurants={restaurants}
                loading={loading}
                onSelectRestaurant={handleSelectRestaurant}
                onForceRefresh={refetch}
                selectedCity={selectedCity}
                onAddToCart={(product) => handleAddToCart(product, 1)}
                onViewAllDishes={() => setStep('all-dishes')}
                onViewAllRestaurants={() => setStep('all-restaurants')}
                onRestaurantClick={(restaurantId) => {
                  const restaurant = restaurants.find(r => r.id === restaurantId);
                  if (restaurant) {
                    handleSelectRestaurant(restaurant);
                  }
                }}
              />
            </motion.div>
          )}

          {step === 'all-dishes' && (
            <motion.div
              key="all-dishes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <AllDishesView
                city={selectedCity}
                onBack={() => setStep('restaurants')}
                onAddToCart={(product) => handleAddToCart(product, 1)}
              />
            </motion.div>
          )}

          {step === 'all-restaurants' && (
            <motion.div
              key="all-restaurants"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <AllRestaurantsView
              city={selectedCity}
              onBack={() => setStep('restaurants')}
              onSelectRestaurant={handleSelectRestaurant}
            />
            </motion.div>
          )}

          {step === 'menu' && selectedRestaurant && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <RestaurantStoreView
              restaurant={selectedRestaurant}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartItem={handleUpdateCartItem}
              onRemoveFromCart={handleRemoveFromCart}
              onProceedToCheckout={() => setStep('checkout')}
              onBack={() => setStep('restaurants')}
            />
            </motion.div>
          )}

          {step === 'checkout' && selectedRestaurant && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <FoodCheckout
              cart={cart}
              restaurant={selectedRestaurant}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              serviceFee={serviceFee}
              total={total}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setStep('menu')}
            />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Cart Sheet */}
      {cart.length > 0 && (
        <FoodCart
          open={showCartSheet}
          onOpenChange={setShowCartSheet}
          cart={cart}
          restaurant={selectedRestaurant || {
            id: cart[0]?.restaurant_id || '',
            restaurant_name: 'Restaurant',
            city: selectedCity,
            address: '',
            is_active: true,
            verification_status: 'approved',
            minimum_order_amount: 0
          }}
          onUpdateQuantity={handleUpdateCartItem}
          onRemove={handleRemoveFromCart}
          onCheckout={() => {
            // Si pas de restaurant sélectionné, naviguer vers celui du panier
            if (!selectedRestaurant && cart.length > 0) {
              const restaurant = restaurants.find(r => r.id === cart[0].restaurant_id);
              if (restaurant) {
                setSelectedRestaurant(restaurant);
                setStep('menu');
              }
            }
            setShowCartSheet(false);
            setStep('checkout');
          }}
        />
      )}

      {/* Success Modal */}
      {selectedRestaurant && (
        <OrderSuccessModal
          open={successModalOpen}
          onOpenChange={(open) => {
            setSuccessModalOpen(open);
            if (!open) {
              setStep('restaurants');
              setSelectedRestaurant(null);
            }
          }}
          orderNumber={lastOrderNumber}
          restaurant={selectedRestaurant}
          deliveryAddress={user?.phone || ''}
          estimatedTime={selectedRestaurant.average_preparation_time || 30}
          onTrackOrder={() => {
            setSuccessModalOpen(false);
            navigate('/food/orders');
          }}
        />
      )}
    </motion.div>
  );
};

export default FoodOrderInterface;
