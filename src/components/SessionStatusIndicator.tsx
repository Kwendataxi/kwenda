import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { WifiOff } from 'lucide-react';

export const SessionStatusIndicator = () => {
  const [isValid, setIsValid] = useState(true);
  
  useEffect(() => {
    const checkSession = async () => {
      // ✅ Utiliser le listener onAuthStateChange au lieu du polling
      const { data: { session } } = await supabase.auth.getSession();
      setIsValid(!!session);
    };

    // ✅ Utiliser le listener onAuthStateChange au lieu du polling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [SessionStatusIndicator] Auth state changed:', event, !!session);
      setIsValid(!!session);
    });

    // Vérification initiale une seule fois
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (!isValid) {
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Session expirée
      </Badge>
    );
  }
  
  return null;
};
