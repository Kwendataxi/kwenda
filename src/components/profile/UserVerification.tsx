import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Phone, FileText, CheckCircle, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserVerificationData {
  id: string;
  phone_verified: boolean;
  identity_verified: boolean;
  identity_document_url: string | null;
  verification_status: string;
}

export const UserVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verification, setVerification] = useState<UserVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    if (user) {
      loadVerificationStatus();
    }
  }, [user]);

  const loadVerificationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create initial verification record
        const { data: newData, error: insertError } = await supabase
          .from('user_verifications')
          .insert({ user_id: user?.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setVerification(newData);
      } else {
        setVerification(data);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    try {
      setSendingCode(true);
      // Simulate sending SMS verification code
      // In real implementation, this would trigger an SMS service
      
      toast({
        title: "Code envoyé",
        description: "Un code de vérification a été envoyé à votre numéro.",
      });

      // For demo purposes, we'll auto-verify after 3 seconds
      setTimeout(async () => {
        await supabase
          .from('user_verifications')
          .update({ phone_verified: true })
          .eq('user_id', user?.id);
        
        loadVerificationStatus();
        
        toast({
          title: "Téléphone vérifié",
          description: "Votre numéro de téléphone a été vérifié avec succès.",
        });
      }, 3000);
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le code de vérification.",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const uploadIdentityDocument = async (file: File) => {
    if (!user) return;

    try {
      setUploadingDocument(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/identity.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update verification with document URL
      const { error: updateError } = await supabase
        .from('user_verifications')
        .update({ 
          identity_document_url: data.publicUrl,
          verification_status: 'pending_review'
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Document téléchargé",
        description: "Votre document d'identité est en cours de vérification.",
      });

      loadVerificationStatus();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document.",
        variant: "destructive",
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximum autorisée est de 10MB.",
          variant: "destructive",
        });
        return;
      }
      uploadIdentityDocument(file);
    }
  };

  const getVerificationProgress = () => {
    if (!verification) return 0;
    let progress = 0;
    if (verification.phone_verified) progress += 50;
    if (verification.identity_verified) progress += 50;
    return progress;
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Vérification du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression</span>
              <span className="text-sm text-muted-foreground">
                {getVerificationProgress()}%
              </span>
            </div>
            <Progress value={getVerificationProgress()} className="h-2" />
          </div>

          {/* Phone Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <div>
                  <h3 className="font-medium">Vérification du téléphone</h3>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez votre numéro de téléphone par SMS
                  </p>
                </div>
              </div>
              {verification?.phone_verified ? (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Vérifié
                </Badge>
              ) : (
                <Badge variant="secondary">En attente</Badge>
              )}
            </div>

            {!verification?.phone_verified && (
              <div className="ml-8 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Code de vérification"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="max-w-40"
                  />
                  <Button
                    onClick={sendVerificationCode}
                    disabled={sendingCode}
                  >
                    {sendingCode ? 'Envoi...' : 'Envoyer le code'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Identity Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="font-medium">Vérification d'identité</h3>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez une pièce d'identité valide
                  </p>
                </div>
              </div>
              {verification?.identity_verified ? (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Vérifié
                </Badge>
              ) : verification?.identity_document_url ? (
                <Badge variant="secondary">En cours de vérification</Badge>
              ) : (
                <Badge variant="outline">Non vérifié</Badge>
              )}
            </div>

            {!verification?.identity_verified && (
              <div className="ml-8">
                <Button
                  variant="outline"
                  disabled={uploadingDocument}
                  asChild
                >
                  <label htmlFor="identity-document-upload" className="cursor-pointer">
                    {uploadingDocument ? (
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {uploadingDocument ? 'Téléchargement...' : 'Télécharger un document'}
                  </label>
                </Button>
                <input
                  id="identity-document-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formats acceptés: JPG, PNG, PDF (max 10MB)
                </p>
              </div>
            )}
          </div>

          {verification?.identity_document_url && (
            <div className="ml-8">
              <p className="text-sm text-green-600">
                ✓ Document téléchargé, vérification en cours
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};