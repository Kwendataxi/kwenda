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
    const body = await req.json()
    const { query, latlng, address, location } = body
    
    // Support de plusieurs formats de requête
    const searchQuery = query || address
    const reverseQuery = latlng
    
    // Validation des paramètres
    if (!searchQuery && !reverseQuery) {
      console.log('Aucune query ou latlng fournie');
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    if (searchQuery && (typeof searchQuery !== 'string' || searchQuery.trim().length < 2)) {
      console.log('Query invalide ou trop courte:', searchQuery);
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    
    // Gestion du géocodage inverse (latlng)
    if (reverseQuery) {
      console.log('Reverse geocoding for:', reverseQuery)
      
      if (!googleMapsApiKey) {
        // Fallback pour le géocodage inverse sans API
        const [lat, lng] = reverseQuery.split(',').map(Number)
        return new Response(
          JSON.stringify({
            results: [{
              formatted_address: `Position (${lat.toFixed(4)}, ${lng.toFixed(4)}), Kinshasa, RDC`,
              geometry: { location: { lat, lng } },
              place_id: `reverse_fallback_${Date.now()}`,
              types: ['premise']
            }]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${reverseQuery}&key=${googleMapsApiKey}&language=fr`
      const reverseResponse = await fetch(reverseUrl)
      const reverseData = await reverseResponse.json()
      
      return new Response(
        JSON.stringify(reverseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Gestion de la recherche normale
    if (!googleMapsApiKey) {
      console.log('Google Maps API key not found, using enhanced fallback geocoding')
      
      // Fallback amélioré avec plus de lieux
      const enhancedPlaces = [
        // Kinshasa - Lieux principaux
        { name: 'Gombe Centre', coords: { lat: -4.3276, lng: 15.3154 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Aéroport N\'djili', coords: { lat: -4.3857, lng: 15.4446 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Marché Central', coords: { lat: -4.3217, lng: 15.3069 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Université de Kinshasa', coords: { lat: -4.4339, lng: 15.3505 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Place de la Poste', coords: { lat: -4.3232, lng: 15.3097 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Boulevard du 30 Juin', coords: { lat: -4.3184, lng: 15.3136 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Matongé', coords: { lat: -4.3891, lng: 15.2877 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Lemba', coords: { lat: -4.3891, lng: 15.2614 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Ngaliema', coords: { lat: -4.3506, lng: 15.2721 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Kintambo', coords: { lat: -4.3298, lng: 15.2889 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Masina', coords: { lat: -4.3833, lng: 15.3667 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Limete', coords: { lat: -4.3667, lng: 15.3167 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Kalamu', coords: { lat: -4.3500, lng: 15.3000 }, city: 'Kinshasa', country: 'CD' },
        { name: 'Bandalungwa', coords: { lat: -4.3333, lng: 15.2833 }, city: 'Kinshasa', country: 'CD' },
        
        // Abidjan - Lieux principaux
        { name: 'Plateau', coords: { lat: 5.3197, lng: -4.0197 }, city: 'Abidjan', country: 'CI' },
        { name: 'Cocody', coords: { lat: 5.3436, lng: -3.9857 }, city: 'Abidjan', country: 'CI' },
        { name: 'Yopougon', coords: { lat: 5.3392, lng: -4.0942 }, city: 'Abidjan', country: 'CI' },
        { name: 'Adjamé', coords: { lat: 5.3609, lng: -4.0267 }, city: 'Abidjan', country: 'CI' },
        { name: 'Treichville', coords: { lat: 5.2984, lng: -4.0164 }, city: 'Abidjan', country: 'CI' },
        { name: 'Aéroport Félix Houphouët-Boigny', coords: { lat: 5.2539, lng: -3.9263 }, city: 'Abidjan', country: 'CI' },
      ]
      
      // Recherche intelligente avec correspondances partielles
      const matches = enhancedPlaces.filter(place => {
        const placeName = place.name.toLowerCase()
        const searchTerm = searchQuery.toLowerCase()
        return placeName.includes(searchTerm) || 
               placeName.replace(/['\s]/g, '').includes(searchTerm.replace(/['\s]/g, '')) ||
               placeName.startsWith(searchTerm) ||
               place.city.toLowerCase().includes(searchTerm)
      })
      
      const fallbackResult = {
        status: 'OK',
        results: matches.slice(0, 6).map(place => ({
          formatted_address: `${place.name}, ${place.city}, ${place.country === 'CD' ? 'RDC' : 'Côte d\'Ivoire'}`,
          geometry: {
            location: {
              lat: place.coords.lat + (Math.random() - 0.5) * 0.003,
              lng: place.coords.lng + (Math.random() - 0.5) * 0.003
            }
          },
          name: place.name,
          place_id: `fallback_${place.name.replace(/\s+/g, '_').toLowerCase()}_${place.country}`,
          types: ['locality', 'political']
        }))
      }
      
      return new Response(
        JSON.stringify(fallbackResult.results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Déterminer la région pour la recherche Google
    const isAbidjan = searchQuery.toLowerCase().includes('abidjan') || 
                     searchQuery.toLowerCase().includes('cocody') || 
                     searchQuery.toLowerCase().includes('plateau') ||
                     searchQuery.toLowerCase().includes('yopougon')
    
    const region = isAbidjan ? 'ci' : 'cd'
    const cityContext = isAbidjan ? 'Abidjan Côte d\'Ivoire' : 'Kinshasa RDC'
    const finalQuery = `${searchQuery} ${cityContext}`
    
    // Appel à l'API Google Places
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(finalQuery)}&key=${googleMapsApiKey}&region=${region}&language=fr`
    
    console.log('Searching with Google Places API:', finalQuery, 'Region:', region)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText)
      throw new Error(`Google Places API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    console.log('Google Places API response status:', data.status)
    console.log('Results found:', data.results?.length || 0)
    
    // Filtrer les résultats selon la région
    if (data.results) {
      data.results = data.results
        .filter((place: any) => {
          const address = place.formatted_address?.toLowerCase() || ''
          if (isAbidjan) {
            return address.includes('abidjan') || address.includes('côte d\'ivoire') || address.includes('ivory coast')
          } else {
            return address.includes('kinshasa') || address.includes('congo') || address.includes('rdc') || 
                   address.includes('democratic republic')
          }
        })
        .slice(0, 8)
    }

    // Retourner les résultats
    return new Response(
      JSON.stringify(data.results || []),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Geocoding proxy error:', error)
    
    // Fallback intelligent en cas d'erreur
    const searchTerm = searchQuery || 'Kinshasa'
    const isAbidjanFallback = searchTerm.toLowerCase().includes('abidjan')
    
    const fallbackResult = {
      status: 'OK',
      results: [{
        formatted_address: isAbidjanFallback ? 
          `${searchTerm}, Abidjan, Côte d'Ivoire` : 
          `${searchTerm}, Kinshasa, RDC`,
        geometry: {
          location: isAbidjanFallback ? {
            lat: 5.3197 + (Math.random() - 0.5) * 0.05,
            lng: -4.0197 + (Math.random() - 0.5) * 0.05
          } : {
            lat: -4.3217 + (Math.random() - 0.5) * 0.05,
            lng: 15.3069 + (Math.random() - 0.5) * 0.05
          }
        },
        name: searchTerm,
        place_id: `fallback_error_${Date.now()}`,
        types: ['point_of_interest']
      }]
    }
    
    return new Response(
      JSON.stringify(fallbackResult.results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})