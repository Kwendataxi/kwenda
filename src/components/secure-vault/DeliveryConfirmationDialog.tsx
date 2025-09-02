import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle, Shield, Clock } from 'lucide-react';

interface DeliveryConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  onConfirm: (transactionId: string, confirmationData: any) => void;
}

export const DeliveryConfirmationDialog: React.FC<DeliveryConfirmationDialogProps> = ({
  open,
  onOpenChange,
  transactionId,
  onConfirm
}) => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [satisfactionConfirmed, setSatisfactionConfirmed] = useState(false);
  const [qualityConfirmed, setQualityConfirmed] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientConfirmed || !deliveryConfirmed || !satisfactionConfirmed || !qualityConfirmed) {
      return;
    }

    setLoading(true);

    try {
      await onConfirm(transactionId, {
        confirmationCode: confirmationCode || `VAULT-${Date.now()}`,
        clientConfirmed: true,
        deliveryConfirmed,
        satisfactionConfirmed,
        qualityConfirmed,
        comments,
        confirmedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfirmationCode('');
    setClientConfirmed(false);
    setDeliveryConfirmed(false);
    setSatisfactionConfirmed(false);
    setQualityConfirmed(false);
    setComments('');
  };

  const allConfirmed = clientConfirmed && deliveryConfirmed && satisfactionConfirmed && qualityConfirmed;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Libération du coffre sécurisé
          </DialogTitle>
          <DialogDescription>
            Confirmez la réception pour libérer les fonds vers les portefeuilles KwendaPay
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Information de sécurité */}
          <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">Protection KwendaPay</p>
              <p className="text-primary/80">
                Vos fonds sont sécurisés jusqu'à confirmation complète de votre satisfaction.
              </p>
            </div>
          </div>

          {/* Code de confirmation */}
          <div className="space-y-2">
            <Label htmlFor="code">Code de livraison (optionnel)</Label>
            <Input
              id="code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="Code fourni par le livreur"
              className="text-center font-mono"
            />
            <p className="text-xs text-muted-foreground">
              📱 Si le livreur vous a fourni un code, saisissez-le pour une sécurité renforcée
            </p>
          </div>

          {/* Confirmations requises */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <h3 className="font-semibold">Confirmations obligatoires</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="delivery-confirmed"
                  checked={deliveryConfirmed}
                  onCheckedChange={(checked) => setDeliveryConfirmed(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="delivery-confirmed" className="text-sm font-normal cursor-pointer">
                    ✅ J'ai bien reçu ma commande complète
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tous les articles commandés ont été livrés à l'adresse correcte
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="quality-confirmed"
                  checked={qualityConfirmed}
                  onCheckedChange={(checked) => setQualityConfirmed(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="quality-confirmed" className="text-sm font-normal cursor-pointer">
                    🔍 Les articles sont conformes et en bon état
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Qualité, quantité et description correspondent exactement
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="satisfaction-confirmed"
                  checked={satisfactionConfirmed}
                  onCheckedChange={(checked) => setSatisfactionConfirmed(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="satisfaction-confirmed" className="text-sm font-normal cursor-pointer">
                    😊 Je suis entièrement satisfait(e)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    L'expérience d'achat et de livraison répond à mes attentes
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="client-confirmed"
                  checked={clientConfirmed}
                  onCheckedChange={(checked) => setClientConfirmed(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="client-confirmed" className="text-sm font-normal cursor-pointer">
                    🔓 J'autorise la libération immédiate des fonds
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Le paiement sera transféré automatiquement aux portefeuilles KwendaPay
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Commentaires optionnels */}
          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires (optionnel)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Votre avis sur cette transaction..."
              rows={3}
            />
          </div>

          {/* Avertissement de sécurité */}
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">⚠️ Action irréversible</p>
              <p className="text-warning/80">
                Une fois confirmée, cette libération ne peut pas être annulée. 
                Les fonds seront instantanément transférés vers les portefeuilles.
              </p>
            </div>
          </div>

          {/* Information sur la répartition */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded">
            💡 <strong>Répartition automatique :</strong> Vendeur 80% • Livreur 15% • Commission Kwenda 5%
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              ❌ Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !allConfirmed}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Libération...
                </div>
              ) : (
                '🔓 Libérer les fonds'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};