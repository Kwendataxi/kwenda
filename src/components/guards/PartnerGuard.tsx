import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const PartnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    checkPartnerRole();
  }, [user]);

  const checkPartnerRole = async () => {
    if (!user) {
      navigate('/partner/auth');
      return;
    }

    // ✅ Vérification SÉCURISÉE via database (pas localStorage!)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'partner')
      .eq('is_active', true)
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('❌ Accès refusé - Rôle partner manquant:', roleError);
      navigate('/'); // Rediriger vers accueil
      return;
    }

    // ✅ Vérifier que le profil partenaire existe dans 'partenaires'
    const { data: profileData, error: profileError } = await supabase
      .from('partenaires')
      .select('id, company_name, verification_status, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('❌ Profil partenaire manquant:', profileError);
      navigate('/partner/register');
      return;
    }

    // ✅ Vérifier que le partenaire est approuvé et actif
    if (profileData.verification_status !== 'approved' || !profileData.is_active) {
      console.warn('⚠️ Partenaire non approuvé:', profileData.verification_status);
      navigate('/partner/pending-approval');
      return;
    }

    setIsPartner(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isPartner ? <>{children}</> : null;
};
