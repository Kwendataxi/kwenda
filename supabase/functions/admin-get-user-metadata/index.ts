import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer client Supabase avec service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Vérifier que l'utilisateur est authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      throw new Error('Unauthorized: Invalid token');
    }

    console.log('✅ User authenticated:', user.id);

    // Vérifier que l'utilisateur est admin
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, admin_level')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminCheck) {
      console.error('❌ Admin check failed:', adminError);
      throw new Error('Access denied: Admin privileges required');
    }

    console.log('✅ Admin verified:', adminCheck);

    // Récupérer les user_ids depuis le body
    const { user_ids } = await req.json();

    if (!user_ids || !Array.isArray(user_ids)) {
      throw new Error('user_ids array required');
    }

    console.log(`📊 Fetching metadata for ${user_ids.length} users`);

    // Récupérer les métadonnées auth pour chaque utilisateur
    const metadata: Record<string, any> = {};
    const errors: string[] = [];

    for (const userId of user_ids) {
      try {
        const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (getUserError) {
          console.error(`❌ Error fetching user ${userId}:`, getUserError);
          errors.push(`User ${userId}: ${getUserError.message}`);
          continue;
        }

        if (authUser?.user) {
          metadata[userId] = {
            last_sign_in_at: authUser.user.last_sign_in_at,
            email_confirmed_at: authUser.user.email_confirmed_at,
            created_at: authUser.user.created_at,
            email: authUser.user.email,
          };
        }
      } catch (err) {
        console.error(`❌ Exception fetching user ${userId}:`, err);
        errors.push(`User ${userId}: ${err.message}`);
      }
    }

    console.log(`✅ Successfully fetched metadata for ${Object.keys(metadata).length} users`);
    if (errors.length > 0) {
      console.warn('⚠️ Some errors occurred:', errors);
    }

    return new Response(
      JSON.stringify({ 
        metadata,
        total_requested: user_ids.length,
        total_fetched: Object.keys(metadata).length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
