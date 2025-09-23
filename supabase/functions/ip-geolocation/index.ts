import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtenir l'IP du client
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1';

    console.log(`🌐 Géolocalisation IP pour: ${clientIP}`);

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Vérifier le cache d'abord
    const { data: cached, error: cacheError } = await supabase
      .from('ip_geolocation_cache')
      .select('*')
      .eq('ip_address', clientIP)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached && !cacheError) {
      console.log('📍 Position récupérée du cache');
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        data: {
          address: `${cached.city}, ${cached.country_name}`,
          lat: cached.latitude,
          lng: cached.longitude,
          type: 'ip',
          accuracy: cached.accuracy,
          source: 'cache'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Essayer plusieurs services de géolocalisation IP
    let locationData = null;

    // Service 1: ipapi.co
    try {
      console.log('🔄 Tentative ipapi.co...');
      const response1 = await fetch(`https://ipapi.co/${clientIP}/json/`, {
        headers: { 'User-Agent': 'Kwenda-App/1.0' }
      });
      const data1 = await response1.json();
      
      if (data1.latitude && data1.longitude && !data1.error) {
        locationData = {
          latitude: data1.latitude,
          longitude: data1.longitude,
          city: data1.city,
          country_name: data1.country_name,
          country_code: data1.country_code,
          provider: 'ipapi.co',
          accuracy: 10000
        };
        console.log('✅ ipapi.co réussi');
      }
    } catch (error) {
      console.warn('❌ ipapi.co échoué:', error.message);
    }

    // Service 2: ip-api.com (fallback)
    if (!locationData) {
      try {
        console.log('🔄 Tentative ip-api.com...');
        const response2 = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,countryCode,city,lat,lon`, {
          headers: { 'User-Agent': 'Kwenda-App/1.0' }
        });
        const data2 = await response2.json();
        
        if (data2.status === 'success' && data2.lat && data2.lon) {
          locationData = {
            latitude: data2.lat,
            longitude: data2.lon,
            city: data2.city,
            country_name: data2.country,
            country_code: data2.countryCode,
            provider: 'ip-api.com',
            accuracy: 15000
          };
          console.log('✅ ip-api.com réussi');
        }
      } catch (error) {
        console.warn('❌ ip-api.com échoué:', error.message);
      }
    }

    // Service 3: freeipapi.com (fallback)
    if (!locationData) {
      try {
        console.log('🔄 Tentative freeipapi.com...');
        const response3 = await fetch(`https://freeipapi.com/api/json/${clientIP}`, {
          headers: { 'User-Agent': 'Kwenda-App/1.0' }
        });
        const data3 = await response3.json();
        
        if (data3.latitude && data3.longitude) {
          locationData = {
            latitude: data3.latitude,
            longitude: data3.longitude,
            city: data3.cityName,
            country_name: data3.countryName,
            country_code: data3.countryCode,
            provider: 'freeipapi.com',
            accuracy: 20000
          };
          console.log('✅ freeipapi.com réussi');
        }
      } catch (error) {
        console.warn('❌ freeipapi.com échoué:', error.message);
      }
    }

    if (!locationData) {
      console.log('❌ Tous les services ont échoué, utilisation du fallback');
      // Fallback basé sur des heuristiques de pays
      locationData = {
        latitude: -4.3217,
        longitude: 15.3069,
        city: 'Kinshasa',
        country_name: 'République Démocratique du Congo',
        country_code: 'CD',
        provider: 'fallback',
        accuracy: 50000
      };
    }

    // Mettre en cache le résultat
    try {
      await supabase
        .from('ip_geolocation_cache')
        .insert({
          ip_address: clientIP,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          country_name: locationData.country_name,
          country_code: locationData.country_code,
          accuracy: locationData.accuracy,
          provider: locationData.provider
        });
      console.log('💾 Résultat mis en cache');
    } catch (error) {
      console.warn('⚠️ Échec cache:', error.message);
    }

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      data: {
        address: `${locationData.city}, ${locationData.country_name}`,
        lat: locationData.latitude,
        lng: locationData.longitude,
        type: 'ip',
        accuracy: locationData.accuracy,
        source: locationData.provider
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Erreur edge function:', error);
    
    // Fallback final
    return new Response(JSON.stringify({
      success: true,
      cached: false,
      fallback: true,
      data: {
        address: 'Kinshasa, République Démocratique du Congo',
        lat: -4.3217,
        lng: 15.3069,
        type: 'ip',
        accuracy: 50000,
        source: 'fallback'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})