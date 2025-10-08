import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, registration_type, registration_data } = await req.json();

    console.log('📋 Complete registration request:', {
      user_id,
      registration_type,
      has_data: !!registration_data
    });

    // Vérifier que le user existe dans auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData?.user) {
      console.error('❌ User not found:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    let result;

    if (registration_type === 'driver') {
      console.log('🚗 Completing driver registration...');
      
      const { data, error } = await supabase.rpc(
        'complete_driver_registration_after_email',
        {
          p_user_id: user_id,
          p_registration_data: registration_data
        }
      );

      if (error) {
        console.error('❌ Driver registration error:', error);
        throw error;
      }

      result = data;
      console.log('✅ Driver registration completed:', result);

    } else if (registration_type === 'partner') {
      console.log('🤝 Completing partner registration...');
      
      const { data, error } = await supabase.rpc(
        'complete_partner_registration_after_email',
        {
          p_user_id: user_id,
          p_registration_data: registration_data
        }
      );

      if (error) {
        console.error('❌ Partner registration error:', error);
        throw error;
      }

      result = data;
      console.log('✅ Partner registration completed:', result);

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid registration type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in complete-registration:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});