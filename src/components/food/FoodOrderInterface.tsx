import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantsQuery } from '@/hooks/useRestaurantsQuery';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantList } from './RestaurantList';
import { RestaurantStoreView } from './RestaurantStoreView';
import { FoodCheckout } from './FoodCheckout';
import { KwendaFoodHeader } from './KwendaFoodHeader';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'framer-motion';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';
import { useLanguage } from '@/contexts/LanguageContext';

type Step = 'restaurants' | 'menu' | 'checkout';

interface FoodOrderInterfaceProps {
  onOrderComplete?: (orderId: string) => void;
  onBack?: () => void;
}

export const FoodOrderInterface = ({ onOrderComplete, onBack }: FoodOrderInterfaceProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<FoodCartItem[]>([]);
  const [step, setStep] = useState<Step>('restaurants');
  const { restaurants, loading, refetch } = useRestaurantsQuery(selectedCity);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setStep('menu');
  };

  const handleAddToCart = (product: FoodProduct, quantity: number = 1, notes?: string) => {
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

      if (error) throw error;

      toast.success(t('food.order_success'), {
        description: t('food.order_number', { number: data.order_number })
      });

      setCart([]);
      setStep('restaurants');
      setSelectedRestaurant(null);
      
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
    } else if (onBack) {
      onBack();
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2000; // Fixed delivery fee for now
  const serviceFee = subtotal * 0.05; // 5% service fee
  const total = subtotal + deliveryFee + serviceFee;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <KwendaFoodHeader
        step={step}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        selectedRestaurant={selectedRestaurant}
        cartItemsCount={cart.length}
        onBack={handleBack}
      />

      {/* Content with Animations */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {step === 'restaurants' && (
            <RestaurantList
              key="restaurants"
              restaurants={restaurants}
              loading={loading}
              onSelectRestaurant={handleSelectRestaurant}
              onForceRefresh={refetch}
              selectedCity={selectedCity}
              onAddToCart={(product) => handleAddToCart(product, 1)}
            />
          )}

          {step === 'menu' && selectedRestaurant && (
            <RestaurantStoreView
              key="menu"
              restaurant={selectedRestaurant}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartItem={handleUpdateCartItem}
              onRemoveFromCart={handleRemoveFromCart}
              onProceedToCheckout={() => setStep('checkout')}
              onBack={() => setStep('restaurants')}
            />
          )}

          {step === 'checkout' && selectedRestaurant && (
            <FoodCheckout
              key="checkout"
              cart={cart}
              restaurant={selectedRestaurant}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              serviceFee={serviceFee}
              total={total}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setStep('menu')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FoodOrderInterface;
