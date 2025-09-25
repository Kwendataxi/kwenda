import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, userId, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context for personalization
    let userProfile = null;
    if (userId) {
      const { data } = await supabase
        .from('user_profiles')
        .select('preferred_language, city, user_type')
        .eq('user_id', userId)
        .single();
      userProfile = data;
    }

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(context, userProfile);

    // Prepare conversation messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with context:', context);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        functions: getContextFunctions(context),
        function_call: 'auto'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message;

    // Handle function calls if present
    if (assistantResponse.function_call) {
      const functionResult = await handleFunctionCall(
        assistantResponse.function_call,
        context,
        userId,
        supabase
      );
      
      return new Response(
        JSON.stringify({
          response: assistantResponse.content || 'Je traite votre demande...',
          functionResult,
          actionPerformed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        response: assistantResponse.content,
        actionPerformed: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Désolé, je rencontre un problème technique. Veuillez réessayer.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function buildSystemPrompt(context: string, userProfile: any): string {
  const basePrompt = `Tu es l'assistant IA de KwendaGo, l'application VTC multimodale pour l'Afrique francophone. Tu aides les utilisateurs avec leurs besoins de transport, livraison, marketplace et location de véhicules.

CONTEXTE GÉOGRAPHIQUE:
- Villes principales: Kinshasa, Lubumbashi, Kolwezi (RDC), Abidjan (Côte d'Ivoire)
- Devises: CDF (RDC), XOF (Côte d'Ivoire)
- Langues: Français (principal), Lingala, Anglais

SERVICES DISPONIBLES:
- Transport: VTC, taxi-bus, moto-taxi
- Livraison: Flash (express), Flex (standard), Maxicharge (gros colis)
- Marketplace: E-commerce avec chat vendeur-acheteur
- Location: Véhicules avec partenaires

Tu dois:
1. Répondre en français sauf demande contraire
2. Être précis et pratique
3. Proposer des solutions concrètes
4. Utiliser les fonctions disponibles quand approprié
5. Tenir compte du contexte local africain`;

  if (userProfile) {
    const userContext = `
PROFIL UTILISATEUR:
- Ville: ${userProfile.city || 'Non spécifiée'}
- Type: ${userProfile.user_type || 'Client'}
- Langue préférée: ${userProfile.preferred_language || 'Français'}`;
    
    return basePrompt + userContext;
  }

  if (context) {
    const contextPrompt = `
CONTEXTE ACTUEL: ${context}
Adapte tes réponses selon ce contexte spécifique.`;
    
    return basePrompt + contextPrompt;
  }

  return basePrompt;
}

function getContextFunctions(context: string) {
  const baseFunctions: any[] = [
    {
      name: 'get_recommendations',
      description: 'Obtenir des recommandations personnalisées',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['destinations', 'products', 'routes'] },
          location: { type: 'string' },
          preferences: { type: 'string' }
        },
        required: ['type']
      }
    },
    {
      name: 'estimate_price',
      description: 'Estimer le prix d\'un service',
      parameters: {
        type: 'object',
        properties: {
          service: { type: 'string', enum: ['transport', 'delivery'] },
          origin: { type: 'string' },
          destination: { type: 'string' },
          vehicle_type: { type: 'string' }
        },
        required: ['service', 'origin', 'destination']
      }
    }
  ];

  if (context === 'transport' || context === 'delivery') {
    baseFunctions.push({
      name: 'find_nearby_drivers',
      description: 'Trouver des chauffeurs à proximité',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          service_type: { type: 'string' },
          radius: { type: 'number' }
        },
        required: ['location', 'service_type']
      }
    });
  }

  if (context === 'marketplace') {
    baseFunctions.push({
      name: 'search_products',
      description: 'Rechercher des produits dans la marketplace',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          category: { type: 'string' },
          location: { type: 'string' },
          price_range: { type: 'string' }
        },
        required: ['query']
      }
    });
  }

  return baseFunctions;
}

async function handleFunctionCall(
  functionCall: any,
  context: string,
  userId: string,
  supabase: any
): Promise<any> {
  const { name, arguments: args } = functionCall;
  const parsedArgs = JSON.parse(args);

  console.log(`Executing function: ${name} with args:`, parsedArgs);

  switch (name) {
    case 'get_recommendations':
      return await getRecommendations(parsedArgs, userId, supabase);
    
    case 'estimate_price':
      return await estimatePrice(parsedArgs, supabase);
    
    case 'find_nearby_drivers':
      return await findNearbyDrivers(parsedArgs, supabase);
    
    case 'search_products':
      return await searchProducts(parsedArgs, supabase);
    
    default:
      return { error: `Fonction ${name} non reconnue` };
  }
}

async function getRecommendations(args: any, userId: string, supabase: any) {
  try {
    if (args.type === 'destinations' && userId) {
      // Get user's frequent destinations
      const { data: trips } = await supabase
        .from('transport_bookings')
        .select('destination_address, destination_coords')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        type: 'destinations',
        recommendations: trips?.slice(0, 5) || [],
        message: 'Voici vos destinations fréquentes'
      };
    }

    if (args.type === 'products') {
      // Get popular products
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('title, price, seller_id, category')
        .eq('status', 'active')
        .order('view_count', { ascending: false })
        .limit(5);

      return {
        type: 'products',
        recommendations: products || [],
        message: 'Produits populaires dans votre région'
      };
    }

    return { message: 'Aucune recommandation disponible pour le moment' };
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return { error: 'Erreur lors de la récupération des recommandations' };
  }
}

async function estimatePrice(args: any, supabase: any) {
  try {
    // Get base pricing for the service
    const { data: pricing } = await supabase
      .from('pricing_rules')
      .select('base_price, price_per_km, service_type, vehicle_type')
      .eq('service_type', args.service)
      .eq('vehicle_type', args.vehicle_type || 'standard')
      .single();

    if (!pricing) {
      return { error: 'Tarification non disponible pour ce service' };
    }

    // Simulate distance calculation (in a real app, use Google Maps API)
    const estimatedDistance = Math.random() * 20 + 2; // 2-22 km
    const estimatedPrice = pricing.base_price + (estimatedDistance * pricing.price_per_km);

    return {
      service: args.service,
      origin: args.origin,
      destination: args.destination,
      estimatedPrice: Math.round(estimatedPrice),
      estimatedDistance: Math.round(estimatedDistance * 10) / 10,
      currency: args.service === 'transport' ? 'CDF' : 'CDF',
      message: `Prix estimé: ${Math.round(estimatedPrice)} CDF pour ~${Math.round(estimatedDistance * 10) / 10} km`
    };
  } catch (error) {
    console.error('Error estimating price:', error);
    return { error: 'Erreur lors de l\'estimation du prix' };
  }
}

async function findNearbyDrivers(args: any, supabase: any) {
  try {
    // Get available drivers (simplified query)
    const { data: drivers } = await supabase
      .from('driver_profiles')
      .select('user_id, vehicle_type, current_location, rating')
      .eq('status', 'available')
      .eq('vehicle_type', args.service_type)
      .limit(5);

    return {
      location: args.location,
      driversFound: drivers?.length || 0,
      drivers: drivers || [],
      message: `${drivers?.length || 0} chauffeur(s) disponible(s) dans votre zone`
    };
  } catch (error) {
    console.error('Error finding drivers:', error);
    return { error: 'Erreur lors de la recherche de chauffeurs' };
  }
}

async function searchProducts(args: any, supabase: any) {
  try {
    let query = supabase
      .from('marketplace_products')
      .select('id, title, price, image_url, seller_id, category')
      .eq('status', 'active')
      .ilike('title', `%${args.query}%`);

    if (args.category) {
      query = query.eq('category', args.category);
    }

    const { data: products } = await query.limit(5);

    return {
      query: args.query,
      category: args.category,
      productsFound: products?.length || 0,
      products: products || [],
      message: `${products?.length || 0} produit(s) trouvé(s) pour "${args.query}"`
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return { error: 'Erreur lors de la recherche de produits' };
  }
}