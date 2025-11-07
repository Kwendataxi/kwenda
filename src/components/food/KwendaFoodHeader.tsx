import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { FoodSearchBar } from './FoodSearchBar';

interface KwendaFoodHeaderProps {
  step: 'restaurants' | 'menu' | 'checkout' | 'all-dishes' | 'all-restaurants';
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedRestaurant?: { restaurant_name: string } | null;
  cartItemsCount: number;
  onBack: () => void;
}

export const KwendaFoodHeader = ({
  step,
  selectedCity,
  onCityChange,
  selectedRestaurant,
  cartItemsCount,
  onBack
}: KwendaFoodHeaderProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getHeaderContent = () => {
    switch (step) {
      case 'menu':
        return {
          title: 'Kwenda Food',
          subtitle: selectedRestaurant?.restaurant_name || '',
          showCitySelector: false
        };
      case 'checkout':
        return {
          title: 'Kwenda Food',
          subtitle: 'Finaliser la commande',
          showCitySelector: false
        };
      default:
        return {
          title: 'Kwenda Food',
          subtitle: 'Vos restaurants préférés',
          showCitySelector: true
        };
    }
  };

  const { title, subtitle, showCitySelector } = getHeaderContent();

  return (
    <header className="relative sticky top-0 z-50 overflow-hidden">
      {/* Gradient moderne avec effet glassmorphism - Adapté mode clair/sombre */}
      <div className={`relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-orange-600 via-red-600 to-orange-700'
          : 'bg-gradient-to-br from-orange-400 via-red-400 to-orange-500'
      }`}>
        {/* Effet ondulé animé */}
        <motion.div 
          className={`absolute inset-0 ${isDark ? 'opacity-20' : 'opacity-30'}`}
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Contenu */}
        <div className="relative z-10 px-4 py-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {step !== 'restaurants' && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    onClick={onBack} 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20 flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate flex items-center gap-2">
                  {title}
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🍽️
                  </motion.span>
                </h1>
                <p className="text-sm text-white/90 truncate">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* SearchBar desktop */}
            {step === 'restaurants' && (
              <div className="hidden md:block flex-1 max-w-md mx-4">
                <FoodSearchBar city={selectedCity} />
              </div>
            )}

            {/* Sélecteur de ville mobile - à la place de la recherche */}
            {showCitySelector && (
              <div className="md:hidden">
                <Select value={selectedCity} onValueChange={onCityChange}>
                  <SelectTrigger className="w-auto h-10 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 transition-colors">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kinshasa">🏙️ Kinshasa</SelectItem>
                    <SelectItem value="Lubumbashi">⚙️ Lubumbashi</SelectItem>
                    <SelectItem value="Kolwezi">💎 Kolwezi</SelectItem>
                    <SelectItem value="Abidjan">🌴 Abidjan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Panier flottant avec animation */}
            {cartItemsCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative flex-shrink-0"
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 relative"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <motion.span
                    key={cartItemsCount}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-white text-[#FF6347] rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center shadow-lg"
                  >
                    {cartItemsCount}
                  </motion.span>
                </Button>
              </motion.div>
            )}
          </motion.div>
          
          {/* Sélecteur de ville desktop uniquement - masqué sur mobile */}
          {showCitySelector && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 hidden md:block"
            >
              <Select value={selectedCity} onValueChange={onCityChange}>
                <SelectTrigger className="w-fit bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 transition-colors">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kinshasa">🏙️ Kinshasa</SelectItem>
                  <SelectItem value="Lubumbashi">⚙️ Lubumbashi</SelectItem>
                  <SelectItem value="Kolwezi">💎 Kolwezi</SelectItem>
                  <SelectItem value="Abidjan">🌴 Abidjan</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>

        {/* Vague décorative en bas */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background/20 to-transparent" />
      </div>
    </header>
  );
};