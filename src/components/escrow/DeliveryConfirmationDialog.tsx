import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientConfirmed || !deliveryConfirmed || !satisfactionConfirmed) {
      return;
    }

    setLoading(true);

    try {
      await onConfirm(transactionId, {
        confirmationCode: confirmationCode || `AUTO-${Date.now()}`,
        clientConfirmed: true,
        deliveryConfirmed,
        satisfactionConfirmed
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
  };

  const allConfirmed = clientConfirmed && deliveryConfirmed && satisfactionConfirmed;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirmer la réception
          </DialogTitle>
          <DialogDescription>
            Confirmez que vous avez bien reçu votre commande avant de libérer les fonds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code de confirmation optionnel */}
          <div className="space-y-2">
            <Label htmlFor="code">Code de confirmation (optionnel)</Label>
            <Input
              id="code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="Code fourni par le livreur"
            />
            <p className="text-xs text-muted-foreground">
              Si le livreur vous a donné un code, saisissez-le ici
            </p>
          </div>

          {/* Confirmations requises */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="delivery-confirmed"
                checked={deliveryConfirmed}
                onCheckedChange={(checked) => setDeliveryConfirmed(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="delivery-confirmed" className="text-sm font-normal cursor-pointer">
                  J'ai bien reçu ma commande
                </Label>
                <p className="text-xs text-muted-foreground">
                  Confirmez que tous les articles commandés ont été livrés
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
                  Je suis satisfait(e) de ma commande
                </Label>
                <p className="text-xs text-muted-foreground">
                  Les articles correspondent à la description et sont en bon état
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
                  Je confirme la libération des fonds
                </Label>
                <p className="text-xs text-muted-foreground">
                  Le paiement sera transféré au vendeur et au livreur
                </p>
              </div>
            </div>
          </div>

          {/* Avertissement */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Attention</p>
              <p className="text-amber-700">
                Une fois confirmée, cette action ne peut pas être annulée. 
                Les fonds seront immédiatement libérés.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !allConfirmed}
              className="flex-1"
            >
              {loading ? 'Confirmation...' : 'Confirmer la réception'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};