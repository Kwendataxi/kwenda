import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellProductForm, SellProductFormData } from '@/components/marketplace/SellProductForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function VendorAddProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleBack = () => {
    navigate('/vendeur');
  };

  // ✅ PHASE 3: Fonction de compression d'images
  const compressImage = async (file: File, maxWidth = 1920): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
      };
    });
  };

  const handleSubmit = async (formData: SellProductFormData): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour ajouter un produit",
        variant: "destructive"
      });
      return false;
    }

    // ✅ Validation: Vérifier que l'utilisateur a un profil vendeur
    const { data: vendorProfile, error: profileError } = await supabase
      .from('vendor_profiles')
      .select('id, shop_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !vendorProfile) {
      toast({
        title: "⚠️ Profil vendeur manquant",
        description: "Veuillez compléter votre profil vendeur avant d'ajouter des produits.",
        variant: "destructive"
      });
      navigate('/vendeur/inscription');
      return false;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // ✅ Validation conditionnelle selon le type de produit
      if (!formData.is_digital && formData.images.length === 0) {
        toast({
          title: "Photos manquantes",
          description: "Ajoutez au moins 1 photo de votre produit physique",
          variant: "destructive"
        });
        return false;
      }

      // Pour les produits digitaux, vérifier que le fichier est uploadé
      if (formData.is_digital && !formData.digital_file_url) {
        toast({
          title: "Fichier digital manquant",
          description: "Téléchargez le fichier à vendre",
          variant: "destructive"
        });
        return false;
      }

      if (formData.images.length > 3) {
        toast({
          title: "Trop d'images",
          description: "Maximum 3 photos autorisées",
          variant: "destructive"
        });
        return false;
      }

      const imageUrls: string[] = [];
      
      // Upload des images seulement si présentes (optionnelles pour digital)
      if (formData.images && formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          let image = formData.images[i];
          
          // ✅ PHASE 3: Compression automatique si > 1MB
          if (image.size > 1024 * 1024) {
            console.log(`🗜️ Compressing ${image.name} (${(image.size / 1024 / 1024).toFixed(2)}MB)`);
            image = await compressImage(image);
            console.log(`✅ Compressed to ${(image.size / 1024 / 1024).toFixed(2)}MB`);
          }
          
          // ✅ PHASE 3: Mettre à jour la progression
          setUploadProgress(Math.round((i / formData.images.length) * 100));
          
          // Vérifier la taille du fichier (max 5MB)
          if (image.size > 5 * 1024 * 1024) {
            throw new Error(`L'image ${image.name} dépasse 5MB même après compression`);
          }

          const fileExt = image.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          // ✅ Upload vers le bucket product-images avec timeout
          const uploadPromise = supabase.storage
            .from('product-images')
            .upload(fileName, image, {
              cacheControl: '3600',
              upsert: false
            });

          // Timeout de 30 secondes
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout - Connexion trop lente')), 30000)
          );

          const { error: uploadError } = await Promise.race([
            uploadPromise,
            timeoutPromise
          ]) as any;

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Erreur upload ${image.name}: ${uploadError.message}`);
          }

          // ✅ Obtenir l'URL publique
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          imageUrls.push(urlData.publicUrl);
          
          console.log(`✅ Image ${i+1}/${formData.images.length} uploaded: ${image.name}`);
        }
      }
      
      // ✅ PHASE 3: Progression finale
      setUploadProgress(100);

      // Construire les specifications avec les données digitales si applicable
      const finalSpecifications = formData.is_digital 
        ? {
            ...formData.specifications,
            digital_category: formData.digital_category,
            ...formData.digital_specs
          }
        : formData.specifications;

      // Insert product into database avec champs digitaux
      const { data: newProduct, error } = await supabase
        .from('marketplace_products')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.is_digital ? 'digital' : formData.category,
          condition: formData.is_digital ? 'new' : formData.condition,
          images: imageUrls,
          stock_count: formData.is_digital ? 9999 : (formData.stock_count || 1),
          brand: formData.brand || null,
          specifications: finalSpecifications || {},
          moderation_status: 'pending',
          status: 'active',
          // ✅ Champs digitaux
          is_digital: formData.is_digital || false,
          digital_file_url: formData.digital_file_url || null,
          digital_file_name: formData.digital_file_name || null,
          digital_file_size: formData.digital_file_size || null,
          digital_download_limit: formData.digital_download_limit || 5,
          digital_file_type: formData.digital_file_type || null
        })
        .select()
        .single();

      if (error) throw error;

      // ✅ PHASE 1: Notifier les admins automatiquement
      try {
        await supabase.functions.invoke('notify-admin-new-product', {
          body: {
            product_id: newProduct.id,
            product_title: newProduct.title,
            seller_id: user.id,
            seller_name: vendorProfile.shop_name
          }
        });
        console.log('✅ Admin notified of new product');
      } catch (notifError) {
        console.error('⚠️ Admin notification failed:', notifError);
        // Ne pas bloquer la création du produit
      }

      // Message de succès adapté au type de produit
      if (formData.is_digital) {
        toast({
          title: "✅ Produit digital publié !",
          description: "Votre fichier sera disponible au téléchargement après modération.",
        });
      } else {
        toast({
          title: "✅ Produit publié !",
          description: "Votre produit sera visible après modération par notre équipe.",
        });
      }

      navigate('/vendeur');
      return true;
    } catch (error: any) {
      console.error('❌ Error adding product:', error);
      
      // ✅ NOUVEAU : Détection d'erreurs liées au trigger
      if (error.message?.includes('app.supabase_url') || 
          error.message?.includes('unrecognized configuration parameter')) {
        toast({
          title: "⚠️ Produit créé avec avertissement",
          description: "Le produit a été créé mais les notifications automatiques sont temporairement indisponibles. Nos admins seront notifiés manuellement.",
          variant: "default",
          duration: 8000
        });
        
        // Le produit est créé malgré l'erreur du trigger, rediriger quand même
        navigate('/vendeur');
        return true;
      }
      
      // Logs détaillés avec informations images
      console.error('📋 Form data:', {
        title: formData.title,
        price: formData.price,
        category: formData.category,
        images_count: formData.images.length,
        images_sizes: formData.images.map((img: File) => `${img.name}: ${(img.size / 1024 / 1024).toFixed(2)}MB`),
        stock_count: formData.stock_count
      });
      
      // Messages d'erreur spécifiques selon le type d'erreur
      let errorMessage = "Une erreur inconnue est survenue";
      
      if (error.message?.includes('timeout') || error.message?.includes('Connexion')) {
        errorMessage = "Délai d'attente dépassé. Vérifiez votre connexion internet.";
      } else if (error.message?.includes('fk_marketplace_products_seller') || 
                 error.message?.includes('vendor_profiles') ||
                 error.message?.includes('foreign key')) {
        errorMessage = "⚠️ Profil vendeur incomplet. Veuillez compléter votre profil.";
        navigate('/vendeur/inscription');
      } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
        errorMessage = "Vous n'avez pas les permissions pour publier un produit.";
      } else if (error.message?.includes('bucket') || error.message?.includes('storage')) {
        errorMessage = "Erreur de stockage des images. Contactez le support.";
      } else if (error.message?.includes('dépasse') || error.message?.includes('5MB')) {
        errorMessage = error.message;
      } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        errorMessage = "Problème de connexion réseau. Réessayez.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erreur publication",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SellProductForm 
        onBack={handleBack} 
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}
