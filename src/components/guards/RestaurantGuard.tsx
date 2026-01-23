import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const RestaurantGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, sessionReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRestaurant, setIsRestaurant] = useState(false);

  const checkRestaurantRole = useCallback(async () => {
    // Attendre que la session soit prête
    if (!sessionReady) {
      console.log('🔍 RestaurantGuard: En attente de sessionReady...');
      return;
    }

    console.log('🔍 RestaurantGuard check', {
      hasUser: !!user,
      userId: user?.id,
      sessionReady
    });

    if (!user) {
      console.log('❌ RestaurantGuard: Pas d\'utilisateur, redirection vers /restaurant/auth');
      setLoading(false);
      navigate('/restaurant/auth', { replace: true });
      return;
    }

    try {
      // Vérification SÉCURISÉE via database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'restaurant')
        .eq('is_active', true)
        .maybeSingle();

      if (roleError || !roleData) {
        console.error('❌ RestaurantGuard: Rôle restaurant manquant:', roleError);
        setLoading(false);
        navigate('/restaurant/auth', { replace: true });
        return;
      }

      console.log('✅ RestaurantGuard: Rôle restaurant confirmé');

      // Vérifier que le profil restaurant existe dans vendor_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('vendor_profiles')
        .select('id, shop_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error('❌ RestaurantGuard: Profil restaurant manquant:', profileError);
        setLoading(false);
        navigate('/restaurant/register', { replace: true });
        return;
      }

      console.log('✅ RestaurantGuard: Accès autorisé pour', profileData.shop_name);
      setIsRestaurant(true);
      setLoading(false);

    } catch (error) {
      console.error('❌ RestaurantGuard: Erreur inattendue:', error);
      setLoading(false);
      navigate('/restaurant/auth', { replace: true });
    }
  }, [user, sessionReady, navigate]);

  useEffect(() => {
    checkRestaurantRole();
  }, [checkRestaurantRole]);

  // Timeout de sécurité : 10 secondes max
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('❌ RestaurantGuard: Timeout de sécurité (10s)');
        setLoading(false);
        navigate('/restaurant/auth', { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="text-muted-foreground">Vérification en cours...</span>
      </div>
    );
  }

  return isRestaurant ? <>{children}</> : null;
};
