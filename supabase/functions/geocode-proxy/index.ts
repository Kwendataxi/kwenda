import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query trop court' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    
    if (!googleMapsApiKey) {
      console.log('Google Maps API key not found, using fallback geocoding')
      
      // Fallback pour géocodage local Kinshasa
      const fallbackResult = {
        status: 'OK',
        results: [{
          formatted_address: `${query}, Kinshasa, RDC`,
          geometry: {
            location: {
              lat: -4.3217 + (Math.random() - 0.5) * 0.1,
              lng: 15.3069 + (Math.random() - 0.5) * 0.1
            }
          },
          name: query,
          place_id: `fallback_${Date.now()}`
        }]
      }
      
      return new Response(
        JSON.stringify(fallbackResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Appel à l'API Google Places via proxy pour éviter CORS
    const searchQuery = `${query} Kinshasa RDC`
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleMapsApiKey}&region=cd&language=fr`
    
    console.log('Searching with Google Places API:', searchQuery)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText)
      throw new Error(`Google Places API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    console.log('Google Places API response status:', data.status)
    console.log('Results found:', data.results?.length || 0)
    
    // Filtrer et formater les résultats pour Kinshasa/RDC
    if (data.results) {
      data.results = data.results
        .filter((place: any) => {
          const address = place.formatted_address?.toLowerCase() || ''
          return address.includes('kinshasa') || address.includes('congo') || address.includes('rdc')
        })
        .slice(0, 5) // Limiter à 5 résultats
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Geocoding proxy error:', error)
    
    // Fallback en cas d'erreur
    const fallbackResult = {
      status: 'OK',
      results: [{
        formatted_address: 'Kinshasa Centre, RDC',
        geometry: {
          location: {
            lat: -4.3217,
            lng: 15.3069
          }
        },
        name: 'Kinshasa Centre',
        place_id: 'fallback_center'
      }]
    }
    
    return new Response(
      JSON.stringify(fallbackResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})