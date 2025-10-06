import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productId, action, rejectionReason } = await req.json();

    // Validation des paramètres
    if (!productId || !action) {
      throw new Error('Missing required parameters: productId and action');
    }

    if (!['approve', 'reject'].includes(action)) {
      throw new Error('Invalid action. Must be "approve" or "reject"');
    }

    console.log('🔍 Moderating product:', { productId, action, rejectionReason });

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Vérifier le rôle admin
    const { data: adminData, error: adminError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (adminError || !adminData) {
      throw new Error('Admin privileges required');
    }

    // Récupérer le produit
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('❌ Error fetching product:', productError);
      throw new Error(`Product not found: ${productError.message}`);
    }

    if (!product) {
      throw new Error('Product not found');
    }

    // Récupérer les informations du vendeur depuis profiles
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', product.seller_id)
      .single();

    // Si pas de profil, essayer depuis clients
    let sellerName = sellerProfile?.display_name;
    if (!sellerName) {
      const { data: clientProfile } = await supabase
        .from('clients')
        .select('display_name')
        .eq('user_id', product.seller_id)
        .single();
      
      sellerName = clientProfile?.display_name || 'Vendeur inconnu';
    }

    console.log('✅ Product found:', product.title, 'Seller:', sellerName);

    // Mettre à jour le statut de modération
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData: any = {
      moderation_status: newStatus,
      moderated_at: new Date().toISOString(),
      moderator_id: user.id
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabase
      .from('marketplace_products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('❌ Error updating product:', updateError);
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    console.log('✅ Product status updated to:', newStatus);

    // Créer une notification pour le vendeur
    const notificationTitle = action === 'approve' 
      ? 'Produit approuvé' 
      : 'Produit rejeté';
    
    const notificationMessage = action === 'approve'
      ? `Votre produit "${product.title}" a été approuvé et est maintenant visible sur la marketplace.`
      : `Votre produit "${product.title}" a été rejeté. Raison: ${rejectionReason || 'Non spécifiée'}`;

    await supabase
      .from('user_notifications')
      .insert({
        user_id: product.seller_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'marketplace',
        priority: action === 'reject' ? 'high' : 'normal',
        data: {
          product_id: productId,
          action,
          rejection_reason: rejectionReason
        }
      });

    // Logger l'action dans activity_logs
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'product_moderation',
        description: `${action === 'approve' ? 'Approved' : 'Rejected'} product: ${product.title}`,
        metadata: {
          product_id: productId,
          action,
          rejection_reason: rejectionReason,
          seller_id: product.seller_id
        }
      });

    console.log('✅ Product moderation completed:', { productId, action });

    return new Response(
      JSON.stringify({ 
        success: true, 
        productId,
        status: newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Moderation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});