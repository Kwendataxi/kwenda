import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const VendorGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    checkVendorRole();
  }, [user]);

  const checkVendorRole = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    // ✅ Vérification SÉCURISÉE via database (pas localStorage!)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'vendor')
      .eq('is_active', true)
      .maybeSingle();

    if (roleError || !roleData) {
      navigate('/marketplace'); // Rediriger vers marketplace client
      return;
    }

    // ✅ Vérifier que le profil vendeur existe
    const { data: profileData, error: profileError } = await supabase
      .from('vendor_profiles')
      .select('id, shop_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('Profil vendeur manquant:', profileError);
      navigate('/vendeur/inscription');
      return;
    }

    setIsVendor(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isVendor ? <>{children}</> : null;
};
