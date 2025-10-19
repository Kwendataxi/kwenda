import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Store, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MarketplaceRoleSwitcherProps {
  currentMode: 'client' | 'vendor';
  className?: string;
}

export const MarketplaceRoleSwitcher = ({ 
  currentMode, 
  className 
}: MarketplaceRoleSwitcherProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVendorRole();
  }, [user]);

  const checkVendorRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'vendor')
        .eq('is_active', true)
        .maybeSingle();

      setIsVendor(!!data);
    } catch (error) {
      console.error('Error checking vendor role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = () => {
    if (currentMode === 'client') {
      if (!isVendor) {
        // Afficher une modale "Devenir vendeur"
        toast({
          title: "Devenir vendeur",
          description: "Vous devez d'abord créer votre profil vendeur",
          action: (
            <Button onClick={() => navigate('/vendeur/inscription')}>
              Créer mon profil
            </Button>
          )
        });
        return;
      }
      
      // Basculer vers espace vendeur
      navigate('/vendeur');
      toast({
        title: "Bienvenue dans votre espace vendeur",
        description: "Gérez vos produits et vos ventes",
      });
    } else {
      // Retour à la marketplace client avec state pour garantir le bon affichage
      navigate('/marketplace', { state: { returnFromVendor: true } });
      toast({
        title: "Retour à la marketplace",
        description: "Continuez vos achats",
      });
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        onClick={handleSwitch}
        variant="outline"
        className={cn(
          "flex items-center gap-3 bg-gradient-to-r hover:scale-105 transition-all duration-300 shadow-lg",
          currentMode === 'client'
            ? "from-purple-500/10 to-pink-600/10 border-purple-500/30 hover:border-purple-500/50"
            : "from-red-500/10 to-pink-600/10 border-red-500/30 hover:border-red-500/50",
          className
        )}
      >
        {currentMode === 'client' ? (
          <>
            <Store className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">Mon espace vendeur</span>
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <ShoppingBag className="h-5 w-5 text-red-600" />
            <span className="font-semibold">Retour marketplace</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </motion.div>
  );
};
