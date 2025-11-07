import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RestaurantImages {
  logo_url: string | null;
  banner_url: string | null;
}

export function RestaurantImageSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [images, setImages] = useState<RestaurantImages>({
    logo_url: null,
    banner_url: null
  });

  useEffect(() => {
    if (user) {
      loadImages();
    }
  }, [user]);

  const loadImages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('logo_url, banner_url')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setImages({
          logo_url: data.logo_url || null,
          banner_url: data.banner_url || null
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement images:', error);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!user) {
      console.error('❌ [RestaurantImages] User non défini');
      return;
    }
    
    console.log(`🖼️ [RestaurantImages] Début upload ${type}:`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type,
      userId: user.id
    });
    
    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ Fichier trop volumineux:', file.size);
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximum est de 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      console.error('❌ Format invalide:', file.type);
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image (JPG, PNG ou WebP)",
        variant: "destructive"
      });
      return;
    }

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      
      console.log(`📤 [RestaurantImages] Upload vers Storage...`, { fileName });

      // Upload vers le bucket 'restaurant-images'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('❌ [RestaurantImages] Erreur Storage upload:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ [RestaurantImages] Upload Storage réussi:', uploadData);

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      console.log(`🔗 [RestaurantImages] URL publique générée:`, publicUrl);
      
      // Mettre à jour le profil restaurant
      const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
      console.log(`💾 [RestaurantImages] Mise à jour de ${updateField}...`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('restaurant_profiles')
        .update({ 
          [updateField]: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('❌ [RestaurantImages] Erreur mise à jour profil:', updateError);
        throw updateError;
      }
      
      console.log('✅ [RestaurantImages] Profil mis à jour:', updateData);

      // Mettre à jour l'état local
      setImages(prev => ({
        ...prev,
        [updateField]: publicUrl
      }));

      toast({
        title: "✅ Image uploadée",
        description: `${type === 'logo' ? 'Logo' : 'Bannière'} mis(e) à jour avec succès`
      });
      
      console.log(`✅ [RestaurantImages] Upload ${type} terminé avec succès`);
    } catch (error: any) {
      console.error('❌ [RestaurantImages] Erreur upload complète:', {
        message: error.message,
        details: error,
        stack: error.stack
      });
      toast({
        title: "Erreur d'upload",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (type: 'logo' | 'banner') => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurant_profiles')
        .update({ 
          [type === 'logo' ? 'logo_url' : 'banner_url']: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setImages(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'banner_url']: null
      }));

      toast({
        title: "Image supprimée",
        description: `${type === 'logo' ? 'Logo' : 'Bannière'} supprimé(e) avec succès`
      });
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur de suppression",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images du restaurant
        </CardTitle>
        <CardDescription>
          Gérez votre logo et bannière
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Logo */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Logo du restaurant</Label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {images.logo_url ? (
              <div className="relative">
                <img 
                  src={images.logo_url} 
                  alt="Logo restaurant" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                  onClick={() => removeImage('logo')}
                  disabled={loading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 w-full space-y-2">
              <Button
                variant="outline"
                disabled={uploading === 'logo'}
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="w-full sm:w-auto"
              >
                {uploading === 'logo' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading === 'logo' ? 'Upload en cours...' : 'Choisir un fichier'}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, 'logo');
                  e.target.value = '';
                }}
              />
              <p className="text-xs text-muted-foreground">
                Format carré recommandé • JPG, PNG ou WebP • Max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Section Bannière */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Bannière du restaurant</Label>
          <div className="space-y-3">
            {images.banner_url ? (
              <div className="relative">
                <img 
                  src={images.banner_url} 
                  alt="Bannière restaurant" 
                  className="w-full h-40 rounded-lg object-cover border-2 border-primary/20 shadow-sm"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                  onClick={() => removeImage('banner')}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-full h-40 rounded-lg bg-muted flex flex-col items-center justify-center border-2 border-dashed border-border">
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Aucune bannière</p>
              </div>
            )}
            <div className="space-y-2">
              <Button
                variant="outline"
                disabled={uploading === 'banner'}
                onClick={() => document.getElementById('banner-upload')?.click()}
                className="w-full sm:w-auto"
              >
                {uploading === 'banner' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading === 'banner' ? 'Upload en cours...' : 'Choisir un fichier'}
              </Button>
              <input
                id="banner-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, 'banner');
                  e.target.value = '';
                }}
              />
              <p className="text-xs text-muted-foreground">
                Format paysage 16:9 recommandé • JPG, PNG ou WebP • Max 5MB
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
