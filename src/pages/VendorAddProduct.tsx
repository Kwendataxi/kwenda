import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellProductForm } from '@/components/marketplace/SellProductForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function VendorAddProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    navigate('/vendeur');
  };

  const handleSubmit = async (formData: any): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour ajouter un produit",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);
    
    try {
      // ✅ Validation du nombre d'images
      if (formData.images.length === 0) {
        toast({
          title: "Photos manquantes",
          description: "Ajoutez au moins 1 photo de votre produit",
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

      // ✅ Upload images to Supabase Storage avec timeout et validation
      const imageUrls: string[] = [];
      
      for (let i = 0; i < formData.images.length; i++) {
        const image = formData.images[i];
        
        // Afficher la progression
        toast({
          title: `📤 Upload en cours`,
          description: `Image ${i + 1}/${formData.images.length} en cours...`,
        });
        
        // Vérifier la taille du fichier (max 5MB)
        if (image.size > 5 * 1024 * 1024) {
          throw new Error(`L'image ${image.name} dépasse 5MB`);
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
        
        // Toast de succès pour chaque image
        toast({
          title: `✅ Image ${i + 1}/${formData.images.length}`,
          description: `Upload réussi`,
        });
        
        console.log(`✅ Image ${i+1}/${formData.images.length} uploaded: ${image.name}`);
      }

      // Insert product into database
      const { data: newProduct, error } = await supabase
        .from('marketplace_products')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          condition: formData.condition,
          images: imageUrls,
          main_image_url: imageUrls[0] || null,
          stock_count: formData.stock_count || 1,
          brand: formData.brand || null,
          specifications: formData.specifications || {},
          moderation_status: 'pending',
          is_active: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Produit ajouté !",
        description: "Votre produit a été soumis pour modération. Vous serez notifié une fois approuvé.",
      });

      navigate('/vendeur');
      return true;
    } catch (error: any) {
      // ✅ Logs détaillés avec informations images
      console.error('❌ Error adding product:', error);
      console.error('📋 Form data:', {
        title: formData.title,
        price: formData.price,
        category: formData.category,
        images_count: formData.images.length,
        images_sizes: formData.images.map((img: File) => `${img.name}: ${(img.size / 1024 / 1024).toFixed(2)}MB`),
        stock_count: formData.stock_count
      });
      
      // ✅ Messages d'erreur spécifiques selon le type d'erreur
      let errorMessage = "Une erreur inconnue est survenue";
      
      if (error.message?.includes('timeout') || error.message?.includes('Connexion')) {
        errorMessage = "Délai d'attente dépassé. Vérifiez votre connexion internet.";
      } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
        errorMessage = "Vous n'avez pas les permissions pour publier un produit.";
      } else if (error.message?.includes('bucket') || error.message?.includes('storage')) {
        errorMessage = "Erreur de stockage des images. Contactez le support.";
      } else if (error.message?.includes('dépasse') || error.message?.includes('5MB')) {
        errorMessage = error.message; // Afficher le message de taille dépassée
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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SellProductForm onBack={handleBack} onSubmit={handleSubmit} />
    </div>
  );
}
