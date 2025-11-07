import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/lib/utils';

interface FoodProductCardProps {
  product: FoodProduct;
  cartQuantity: number;
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
}

export const FoodProductCard = ({ product, cartQuantity, onAddToCart }: FoodProductCardProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Image grande avec effet hover */}
            <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden group">
              {product.main_image_url ? (
                <>
                  <motion.img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.15, rotate: 2 }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Overlay avec icône "Add" au hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button 
                        size="icon" 
                        className="rounded-full shadow-xl bg-gradient-to-r from-[#FF6347] to-[#FFA500]"
                        onClick={handleAdd}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF6347]/20 to-[#FFA500]/20 flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}

              {/* Badge quantité panier */}
              {cartQuantity > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 left-2"
                >
                  <Badge className="bg-[#FF6347] text-white shadow-lg border-0">
                    {cartQuantity} dans panier
                  </Badge>
                </motion.div>
              )}
            </div>
            
            {/* Info produit */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-lg line-clamp-1 text-foreground">
                  {product.name}
                </h4>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {product.description || 'Délicieux plat préparé avec soin'}
                  </p>
                )}
              </div>
              
              {/* Prix & Quantité */}
              <div className="flex items-end justify-between mt-3">
                <div>
                  <p className="text-2xl font-bold text-[#FF6347]">
                    {formatPrice(product.price)}
                  </p>
                </div>
                
                {/* Bouton Add avec animation */}
                <AnimatePresence mode="wait">
                  {cartQuantity === 0 ? (
                    <motion.div 
                      key="add-button"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        className="rounded-full shadow-md bg-gradient-to-r from-[#FF6347] to-[#FFA500] hover:from-[#FF4500] hover:to-[#FF8C00] text-white border-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="quantity-controls"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-2 bg-[#FF6347]/10 rounded-full px-3 py-1.5"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-full hover:bg-[#FF6347]/20"
                        onClick={() => {
                          if (quantity > 1) setQuantity(quantity - 1);
                        }}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <motion.span
                        key={quantity}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className="font-bold text-[#FF6347] w-6 text-center"
                      >
                        {quantity}
                      </motion.span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-full hover:bg-[#FF6347]/20"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          onClick={handleAdd}
                          className="bg-gradient-to-r from-[#FF6347] to-[#FFA500] hover:from-[#FF4500] hover:to-[#FF8C00] text-white border-0 h-7 rounded-full px-3"
                        >
                          +{quantity}
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};