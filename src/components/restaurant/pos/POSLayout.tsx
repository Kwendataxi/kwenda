import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { POSProductGrid } from './POSProductGrid';
import { POSCart } from './POSCart';
import { POSSessionManager } from './POSSessionManager';
import { usePOSSession } from '@/hooks/usePOSSession';
import { usePOSTransactions, type POSTransactionItem } from '@/hooks/usePOSTransactions';

export const POSLayout = () => {
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [cart, setCart] = useState<POSTransactionItem[]>([]);
  
  const { currentSession, getCurrentSession } = usePOSSession();
  const { createTransaction } = usePOSTransactions();

  useEffect(() => {
    loadRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      getCurrentSession(restaurantId);
    }
  }, [restaurantId]);

  const loadRestaurantProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('restaurant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setRestaurantId(profile.id);
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  const handleAddToCart = (product: any) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
      }]);
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ));
    }
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'mobile_money' | 'kwenda_pay') => {
    if (!currentSession || !restaurantId) return;

    const transaction = await createTransaction(
      currentSession.id,
      restaurantId,
      cart,
      paymentMethod
    );

    if (transaction) {
      setCart([]);
    }
  };

  if (!currentSession) {
    return restaurantId ? (
      <POSSessionManager restaurantId={restaurantId} />
    ) : null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/restaurant')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Caisse Kwenda POS</h1>
        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid - 70% */}
        <div className="flex-1 overflow-auto p-4">
          {restaurantId && <POSProductGrid restaurantId={restaurantId} onAddToCart={handleAddToCart} />}
        </div>

        {/* Cart Sidebar - 30% */}
        <div className="w-full lg:w-[400px] border-l bg-card">
          <POSCart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={handleCheckout}
            session={currentSession}
          />
        </div>
      </div>
    </div>
  );
};
