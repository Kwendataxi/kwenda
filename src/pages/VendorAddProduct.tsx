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
      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      
      for (const image of formData.images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        imageUrls.push(urlData.publicUrl);
      }

      // Insert product into database
      const { error } = await supabase
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
          stock_quantity: formData.stock_count || 1,
          brand: formData.brand || null,
          specifications: formData.specifications || {},
          moderation_status: 'pending',
          status: 'draft' // ✅ PHASE 2.1: Produit en brouillon jusqu'à approbation
        });

      if (error) throw error;

      toast({
        title: "✅ Produit ajouté !",
        description: "Votre produit a été soumis pour modération. Vous serez notifié une fois approuvé.",
      });

      navigate('/vendeur');
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "❌ Erreur",
        description: "Une erreur est survenue lors de l'ajout du produit",
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
