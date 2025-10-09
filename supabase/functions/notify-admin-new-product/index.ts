import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductNotificationPayload {
  productId: string;
  sellerId: string;
  productTitle: string;
  productCategory: string;
  productPrice: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: ProductNotificationPayload = await req.json();
    console.log('📦 Nouveau produit à modérer:', payload);

    // 1. Récupérer les informations du vendeur
    const { data: sellerData, error: sellerError } = await supabase
      .from('clients')
      .select('display_name, email')
      .eq('user_id', payload.sellerId)
      .single();

    if (sellerError) {
      console.error('Erreur récupération vendeur:', sellerError);
    }

    const sellerName = sellerData?.display_name || 'Vendeur inconnu';

    // 2. Créer une notification pour les admins
    const { error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'product_moderation',
        severity: 'info',
        title: '📦 Nouveau produit à modérer',
        message: `${sellerName} a publié "${payload.productTitle}" - Catégorie: ${payload.productCategory} - Prix: ${payload.productPrice.toLocaleString()} CDF`,
        data: {
          product_id: payload.productId,
          seller_id: payload.sellerId,
          seller_name: sellerName,
          product_title: payload.productTitle,
          product_category: payload.productCategory,
          product_price: payload.productPrice
        }
      });

    if (notificationError) {
      console.error('❌ Erreur création notification admin:', notificationError);
      throw notificationError;
    }

    console.log('✅ Notification admin créée avec succès');

    // 3. Créer une notification pour le vendeur
    const { error: vendorNotificationError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: payload.sellerId,
        title: '⏳ Produit en cours de modération',
        content: `Votre produit "${payload.productTitle}" est en cours de vérification. Vous serez notifié une fois la modération terminée.`,
        priority: 'normal',
        action_url: '/marketplace/my-products',
        action_label: 'Voir mes produits'
      });

    if (vendorNotificationError) {
      console.error('⚠️ Erreur notification vendeur:', vendorNotificationError);
    }

    // 4. Logger l'activité
    await supabase
      .from('activity_logs')
      .insert({
        user_id: payload.sellerId,
        activity_type: 'product_created',
        description: `Produit créé: ${payload.productTitle}`,
        metadata: {
          product_id: payload.productId,
          category: payload.productCategory,
          price: payload.productPrice
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications créées avec succès' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erreur dans notify-admin-new-product:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
