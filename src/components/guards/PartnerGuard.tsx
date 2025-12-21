import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const PartnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, sessionReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  const checkPartnerRole = useCallback(async () => {
    // ✅ Attendre que la session soit prête
    if (!sessionReady) {
      console.log('🔍 PartnerGuard: En attente de sessionReady...');
      return;
    }

    console.log('🔍 PartnerGuard check', {
      hasUser: !!user,
      userId: user?.id,
      sessionReady
    });

    if (!user) {
      console.log('❌ PartnerGuard: Pas d\'utilisateur, redirection vers /partner/auth');
      setLoading(false);
      navigate('/partner/auth');
      return;
    }

    try {
      // ✅ Vérification SÉCURISÉE via database (pas localStorage!)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'partner')
        .eq('is_active', true)
        .maybeSingle();

      if (roleError || !roleData) {
        console.error('❌ PartnerGuard: Rôle partner manquant:', roleError);
        setLoading(false);
        navigate('/partner/auth', { replace: true });
        return;
      }

      console.log('✅ PartnerGuard: Rôle partner confirmé');

      // ✅ Vérifier que le profil partenaire existe dans 'partenaires'
      const { data: profileData, error: profileError } = await supabase
        .from('partenaires')
        .select('id, company_name, verification_status, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error('❌ PartnerGuard: Profil partenaire manquant:', profileError);
        setLoading(false);
        navigate('/partner/register');
        return;
      }

      console.log('✅ PartnerGuard: Profil partenaire trouvé:', profileData.company_name);

      // ✅ Vérifier que le partenaire est vérifié et actif
      if (profileData.verification_status !== 'verified' || !profileData.is_active) {
        console.warn('⚠️ PartnerGuard: Partenaire non vérifié:', profileData.verification_status);
        setLoading(false);
        navigate('/partner/pending-approval');
        return;
      }

      console.log('✅ PartnerGuard: Accès autorisé pour', profileData.company_name);
      setIsPartner(true);
      setLoading(false);

    } catch (error) {
      console.error('❌ PartnerGuard: Erreur inattendue:', error);
      setLoading(false);
      navigate('/partner/auth', { replace: true });
    }
  }, [user, sessionReady, navigate]);

  useEffect(() => {
    checkPartnerRole();
  }, [checkPartnerRole]);

  // ✅ Timeout de sécurité : 10 secondes max pour éviter blocage infini
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('❌ PartnerGuard: Timeout de sécurité (10s)');
        setLoading(false);
        navigate('/partner/auth');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-muted-foreground">Vérification en cours...</span>
      </div>
    );
  }

  return isPartner ? <>{children}</> : null;
};
