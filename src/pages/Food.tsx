import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FoodOrderInterface } from '@/components/food/FoodOrderInterface';
import { FoodServiceTransition } from '@/components/food/FoodServiceTransition';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';
import { FoodBackToTop } from '@/components/food/FoodBackToTop';

export default function Food() {
  const navigate = useNavigate();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [openCartCallback, setOpenCartCallback] = useState<(() => void) | null>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/app/client');
    }
  };

  const handleCartStateChange = useCallback((count: number, openCart: () => void) => {
    setCartItemsCount(count);
    setOpenCartCallback(() => openCart);
  }, []);

  const handleCartClick = useCallback(() => {
    if (openCartCallback) {
      openCartCallback();
    }
  }, [openCartCallback]);

  return (
    <>
      <FoodServiceTransition>
        <FoodOrderInterface 
          onBack={handleBack}
          onOrderComplete={(orderId) => {
            console.log('Order completed:', orderId);
          }}
          onCartStateChange={handleCartStateChange}
        />
      </FoodServiceTransition>
      <FoodBackToTop />
      <FoodFooterNav 
        cartItemsCount={cartItemsCount}
        onCartClick={handleCartClick}
      />
    </>
  );
}
