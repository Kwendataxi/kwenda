import { supabase } from '@/integrations/supabase/client';
import { getValidSession } from './authHelpers';

interface InvokeOptions {
  functionName: string;
  body: any;
  retryOn401?: boolean;
}

export const invokeEdgeFunction = async ({
  functionName,
  body,
  retryOn401 = true
}: InvokeOptions) => {
  const session = await getValidSession();
  if (!session) throw new Error('Session invalide');
  
  let attempt = 0;
  const maxAttempts = retryOn401 ? 2 : 1;
  
  while (attempt < maxAttempts) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
      // ✅ Pas de header Authorization manuel - Supabase le gère automatiquement
    });
    
    // Si erreur 401 et retry activé
    if (error?.message?.includes('401') && attempt === 0 && retryOn401) {
      console.warn('🔄 Retry après refresh session...');
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      
      if (newSession) {
        attempt++;
        continue; // Retry avec nouvelle session
      }
    }
    
    return { data, error };
  }
  
  throw new Error('Échec après retry');
};
