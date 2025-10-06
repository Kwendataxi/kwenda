import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileCheck, AlertCircle, CheckCircle, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUserVerification } from '@/hooks/useUserVerification';

export const VerificationDocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { verification, fetchVerificationStatus } = useUserVerification();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (file.size > maxSize) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 5MB',
        variant: 'destructive'
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Format non supporté',
        description: 'Formats acceptés : JPG, PNG, PDF',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    // Créer un aperçu pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/identity_${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique (avec signature)
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      // Mettre à jour user_verification avec l'URL du document
      const { error: updateError } = await supabase
        .from('user_verification')
        .update({
          identity_document_url: fileName,
          verification_status: 'pending_review',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: '✅ Document envoyé avec succès',
        description: 'Votre document est en cours de vérification par nos équipes'
      });

      // Rafraîchir les données de vérification
      await fetchVerificationStatus();
      
      // Réinitialiser
      setSelectedFile(null);
      setPreviewUrl(null);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erreur d\'upload',
        description: error.message || 'Impossible d\'envoyer le document',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = () => {
    if (!verification) return null;

    const statusConfig = {
      'none': { label: 'Non vérifié', variant: 'outline' as const, icon: AlertCircle, color: 'text-muted-foreground' },
      'pending_review': { label: 'En attente', variant: 'outline' as const, icon: Upload, color: 'text-orange-600' },
      'approved': { label: 'Vérifié', variant: 'outline' as const, icon: CheckCircle, color: 'text-green-600' },
      'rejected': { label: 'Rejeté', variant: 'destructive' as const, icon: X, color: 'text-red-600' }
    };

    const status = verification.verification_status || 'none';
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.none;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Vérification d'identité</CardTitle>
            <CardDescription className="mt-2">
              Pour vendre sur la marketplace, vous devez vérifier votre identité
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Documents acceptés
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>✓ Carte d'identité nationale (recto-verso)</li>
            <li>✓ Passeport (page d'identité)</li>
            <li>✓ Permis de conduire</li>
            <li>✓ Formats : JPG, PNG ou PDF (max 5MB)</li>
          </ul>
        </div>

        {/* Document déjà uploadé */}
        {verification?.identity_document_url && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Document déjà soumis
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {verification.verification_status === 'pending_review' 
                    ? 'Votre document est en cours de vérification'
                    : verification.verification_status === 'approved'
                    ? 'Votre identité a été vérifiée avec succès'
                    : 'Vous pouvez soumettre un nouveau document'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Zone d'upload */}
        <div className="space-y-4">
          <label className="block">
            <div className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${selectedFile 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'}
            `}>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              
              {previewUrl ? (
                <div className="space-y-4">
                  <img 
                    src={previewUrl} 
                    alt="Aperçu" 
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm font-medium text-primary">
                    {selectedFile?.name}
                  </p>
                </div>
              ) : selectedFile ? (
                <div className="space-y-2">
                  <FileCheck className="h-12 w-12 mx-auto text-primary" />
                  <p className="text-sm font-medium text-primary">
                    {selectedFile.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Cliquez pour sélectionner un document
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou PDF (max 5MB)
                  </p>
                </div>
              )}
            </div>
          </label>

          {/* Boutons d'action */}
          {selectedFile && (
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Envoyer le document
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                variant="outline"
                disabled={isUploading}
                size="lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Informations de sécurité */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Vos documents sont stockés de manière sécurisée et ne sont visibles que par les administrateurs.
              Le traitement prend généralement 24-48h.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
