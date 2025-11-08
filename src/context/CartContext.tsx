import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem } from '@/types/marketplace';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('kwenda_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('kwenda_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kwenda_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: any) => {
    // Gérer à la fois inStock (MarketplaceProduct) et isAvailable (ancien format)
    const isProductAvailable = product.inStock ?? product.isAvailable ?? true;
    
    if (!isProductAvailable) {
      toast({
        title: "Produit indisponible",
        description: "Ce produit n'est plus en stock",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
      toast({
        title: "Quantité mise à jour",
        description: `${product.name} - Quantité: ${existingItem.quantity + 1}`,
      });
    } else {
      const cartItem: CartItem = {
        id: product.id,
        product_id: product.id,
        name: product.title || product.name, // Gérer les deux formats
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image || (product.images && product.images[0]) || '',
        quantity: 1,
        seller: product.seller?.display_name || product.seller || 'Vendeur',
        seller_id: product.seller_id || product.sellerId,
        category: product.category,
        isAvailable: product.inStock ?? product.isAvailable ?? true,
        coordinates: product.coordinates,
      };
      
      setCartItems(prev => [...prev, cartItem]);
      toast({
        title: "Ajouté au panier",
        description: `${product.name} a été ajouté à votre panier`,
      });
    }
  };

  const removeFromCart = (id: string) => {
    const item = cartItems.find(item => item.id === id);
    setCartItems(prev => prev.filter(item => item.id !== id));
    
    if (item) {
      toast({
        title: "Retiré du panier",
        description: `${item.name} a été retiré de votre panier`,
      });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Panier vidé",
      description: "Tous les articles ont été retirés de votre panier",
    });
  };

  const isInCart = (id: string) => {
    return cartItems.some(item => item.id === id);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const value: CartContextType = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};