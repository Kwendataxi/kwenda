import { supabase } from '@/integrations/supabase/client';

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
  console.log(`🚀 [invokeEdgeFunction] Appel à ${functionName}`);
  
  let attempt = 0;
  const maxAttempts = retryOn401 ? 2 : 1;
  
  while (attempt < maxAttempts) {
    // ✅ Utiliser le client Supabase directement - il gère automatiquement le token
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
    });
    
    // Si erreur 401 et retry activé
    if (error?.message?.includes('401') && attempt === 0 && retryOn401) {
      console.warn('🔄 Retry après refresh session...');
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (newSession && !refreshError) {
        console.log('✅ Session rafraîchie, nouvelle tentative');
        attempt++;
        continue; // Retry avec session fraîche
      } else {
        console.error('❌ Échec refresh session:', refreshError);
        return { data, error }; // Échec refresh, retourner l'erreur originale
      }
    }
    
    return { data, error };
  }
  
  throw new Error('Échec après retry');
};
