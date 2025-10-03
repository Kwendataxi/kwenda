import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertCircle, Phone, Mail, Calendar, ZoomIn, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VerificationHistoryTimeline } from './VerificationHistoryTimeline';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VerificationDetailDialogProps {
  verification: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerificationDetailDialog = ({ verification, open, onClose, onSuccess }: VerificationDetailDialogProps) => {
  const { toast } = useToast();
  const [phoneVerified, setPhoneVerified] = useState(verification.phone_verified);
  const [identityVerified, setIdentityVerified] = useState(verification.identity_verified);
  const [verificationLevel, setVerificationLevel] = useState(verification.verification_level);
  const [adminNotes, setAdminNotes] = useState(verification.admin_notes || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const handleAction = async (action: 'approve' | 'reject' | 'request_info') => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-user-account', {
        body: {
          user_id: verification.user_id,
          action,
          phone_verified: phoneVerified,
          identity_verified: identityVerified,
          verification_level: verificationLevel,
          admin_notes: adminNotes,
          rejection_reason: action === 'reject' ? rejectionReason : undefined
        }
      });

      if (error) throw error;

      toast({
        title: action === 'approve' ? '✅ Compte approuvé' : 
               action === 'reject' ? '❌ Compte rejeté' : 
               '⚠️ Informations demandées',
        description: action === 'approve' 
          ? 'L\'utilisateur peut maintenant vendre sur la marketplace'
          : action === 'reject'
          ? 'L\'utilisateur a été notifié du rejet'
          : 'L\'utilisateur a été notifié de fournir plus d\'informations'
      });

      onSuccess();
    } catch (error: any) {
      console.error('Verification action error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de traiter la demande',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Vérification du compte
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* User Information */}
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h3 className="font-semibold text-lg">Informations utilisateur</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{verification.clients?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{verification.clients?.phone_number}</span>
                  {verification.phone_verified && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />Vérifié
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Inscrit {formatDistanceToNow(new Date(verification.created_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Preview */}
            {verification.identity_document_url && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Document d'identité</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 2))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden bg-muted p-2">
                  <img
                    src={verification.identity_document_url}
                    alt="Document d'identité"
                    className="w-full h-auto transition-transform"
                    style={{
                      transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                      transformOrigin: 'center'
                    }}
                  />
                </div>
              </div>
            )}

            {/* History Timeline */}
            <VerificationHistoryTimeline userId={verification.user_id} />
          </div>

          {/* Validation Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Formulaire de validation</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="phone"
                  checked={phoneVerified}
                  onCheckedChange={(checked) => setPhoneVerified(!!checked)}
                />
                <Label htmlFor="phone" className="cursor-pointer">
                  Téléphone vérifié
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="identity"
                  checked={identityVerified}
                  onCheckedChange={(checked) => setIdentityVerified(!!checked)}
                />
                <Label htmlFor="identity" className="cursor-pointer">
                  Identité vérifiée
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Niveau de vérification</Label>
                <Select value={verificationLevel} onValueChange={setVerificationLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basique</SelectItem>
                    <SelectItem value="verified">Vérifié</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes admin (optionnel)</Label>
                <Textarea
                  placeholder="Ajoutez vos observations..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {verification.verification_status === 'pending_review' && (
                <div className="space-y-2">
                  <Label className="text-red-600">Raison du rejet (si applicable)</Label>
                  <Textarea
                    placeholder="Expliquez pourquoi ce document est rejeté..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t pt-6 mt-6 bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4 text-center">Actions de validation</h3>
              <div className="space-y-3 sm:space-y-4">
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={isProcessing || !verification.identity_document_url}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approuver le compte
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleAction('reject')}
                  disabled={isProcessing || !rejectionReason}
                  variant="destructive"
                  className="w-full font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 mr-2" />
                      Rejeter avec raison
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleAction('request_info')}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950 font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-orange-700 border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Demander plus d'infos
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
