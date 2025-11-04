// Edge Function: Notify admins when a new product is submitted
// Deployed: 2025-11-04
// Purpose: Send notifications to all admins when a vendor submits a product for moderation

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
    console.log('📦 Nouveau produit soumis:', payload);

    // 1. Récupérer les informations du vendeur
    const { data: sellerData, error: sellerError } = await supabase
      .from('vendor_profiles')
      .select('shop_name, user_id')
      .eq('user_id', payload.sellerId)
      .single();

    if (sellerError) {
      console.error('❌ Erreur récupération vendeur:', sellerError);
    }

    const sellerName = sellerData?.shop_name || 'Vendeur inconnu';

    // 2. Récupérer tous les admins actifs
    const { data: admins, error: adminsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (adminsError) {
      console.error('❌ Erreur récupération admins:', adminsError);
      throw adminsError;
    }

    console.log(`👥 ${admins?.length || 0} admin(s) trouvé(s)`);

    // 3. Créer une notification pour chaque admin
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        admin_id: admin.user_id,
        notification_type: 'new_product_pending',
        title: '📦 Nouveau produit à modérer',
        message: `${sellerName} a soumis "${payload.productTitle}" - ${payload.productCategory} - ${payload.productPrice.toLocaleString()} CDF`,
        metadata: {
          product_id: payload.productId,
          seller_id: payload.sellerId,
          seller_name: sellerName,
          product_title: payload.productTitle,
          product_category: payload.productCategory,
          product_price: payload.productPrice,
          action_url: '/admin/marketplace'
        }
      }));

      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('❌ Erreur création notifications admin:', notificationError);
        throw notificationError;
      }

      console.log(`✅ ${notifications.length} notification(s) admin créée(s)`);
    }

    // 4. Créer une notification pour le vendeur via vendor_notifications
    try {
      await supabase
        .from('vendor_notifications')
        .insert({
          vendor_id: payload.sellerId,
          order_id: payload.productId, // Référence au produit
          notification_type: 'product_moderation',
          title: '⏳ Produit en cours de modération',
          message: `Votre produit "${payload.productTitle}" est en cours de vérification. Vous serez notifié dès que la modération sera terminée.`,
          priority: 'normal',
          metadata: {
            product_id: payload.productId,
            product_title: payload.productTitle,
            product_category: payload.productCategory,
            product_price: payload.productPrice,
            action_url: '/vendeur/produits'
          }
        });
      console.log('✅ Notification vendeur créée');
    } catch (vendorError) {
      console.error('⚠️ Erreur notification vendeur (non bloquant):', vendorError);
    }

    // 5. Logger l'activité
    await supabase
      .from('activity_logs')
      .insert({
        user_id: payload.sellerId,
        activity_type: 'product_created',
        description: `Produit soumis pour modération: ${payload.productTitle}`,
        metadata: {
          product_id: payload.productId,
          category: payload.productCategory,
          price: payload.productPrice
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications créées avec succès',
        admins_notified: admins?.length || 0
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
