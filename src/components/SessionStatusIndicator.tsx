import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { WifiOff } from 'lucide-react';

export const SessionStatusIndicator = () => {
  const [isValid, setIsValid] = useState(true);
  
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValid(!!session?.access_token);
    };
    
    checkSession();
    const interval = setInterval(checkSession, 30000); // Vérif toutes les 30s
    
    return () => clearInterval(interval);
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
