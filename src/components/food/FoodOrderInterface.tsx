import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurants } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantList } from './RestaurantList';
import { RestaurantMenu } from './RestaurantMenu';
import { FoodCheckout } from './FoodCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';

type Step = 'restaurants' | 'menu' | 'checkout';

interface FoodOrderInterfaceProps {
  onOrderComplete?: (orderId: string) => void;
  onBack?: () => void;
}

export const FoodOrderInterface = ({ onOrderComplete, onBack }: FoodOrderInterfaceProps) => {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<FoodCartItem[]>([]);
  const [step, setStep] = useState<Step>('restaurants');
  const { restaurants, loading, fetchRestaurants } = useRestaurants();

  useEffect(() => {
    fetchRestaurants(selectedCity);
  }, [selectedCity]);

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

    toast.success(`${product.name} ajouté au panier`);
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

      toast.success('Commande passée avec succès !', {
        description: `Numéro de commande: #${data.order_number}`
      });

      setCart([]);
      setStep('restaurants');
      setSelectedRestaurant(null);
      
      if (onOrderComplete && data.order_id) {
        onOrderComplete(data.order_id);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error('Erreur lors de la commande', {
        description: error.message || 'Veuillez réessayer'
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
      <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {step === 'restaurants' && 'Restaurants'}
              {step === 'menu' && selectedRestaurant?.restaurant_name}
              {step === 'checkout' && 'Finaliser la commande'}
            </h1>
            {step === 'restaurants' && (
              <div className="flex items-center gap-2 text-sm opacity-90">
                <MapPin className="h-4 w-4" />
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="h-7 w-auto border-white/30 bg-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                    <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                    <SelectItem value="Kolwezi">Kolwezi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {cart.length > 0 && step !== 'checkout' && (
            <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
              {cart.length} {cart.length === 1 ? 'article' : 'articles'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {step === 'restaurants' && (
          <RestaurantList
            restaurants={restaurants}
            loading={loading}
            onSelectRestaurant={handleSelectRestaurant}
          />
        )}

        {step === 'menu' && selectedRestaurant && (
          <RestaurantMenu
            restaurant={selectedRestaurant}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartItem={handleUpdateCartItem}
            onRemoveFromCart={handleRemoveFromCart}
            onProceedToCheckout={() => setStep('checkout')}
          />
        )}

        {step === 'checkout' && selectedRestaurant && (
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
        )}
      </div>
    </div>
  );
};

export default FoodOrderInterface;
