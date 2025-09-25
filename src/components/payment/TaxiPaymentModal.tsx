import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  CreditCard,
  Banknote,
  Star,
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  Gift,
  Check
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

interface TaxiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    id: string;
    pickup: { address: string };
    destination: { address: string };
    actualPrice: number;
    distance: number;
    duration: string;
    driverName: string;
    driverRating: number;
  };
  onPaymentComplete: (paymentData: any) => void;
}

const PAYMENT_METHODS = [
  {
    id: 'kwenda_wallet',
    name: 'KwendaPay',
    description: 'Votre portefeuille numérique',
    icon: Wallet,
    color: 'primary'
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    description: 'Orange Money, M-Pesa',
    icon: CreditCard,
    color: 'secondary'
  },
  {
    id: 'cash',
    name: 'Espèces',
    description: 'Paiement au chauffeur',
    icon: Banknote,
    color: 'muted'
  }
];

export default function TaxiPaymentModal({ 
  isOpen, 
  onClose, 
  bookingData, 
  onPaymentComplete 
}: TaxiPaymentModalProps) {
  const { wallet } = useWallet();
  const [selectedMethod, setSelectedMethod] = useState<string>('kwenda_wallet');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const totalAmount = bookingData.actualPrice + tipAmount;
  const hasInsufficientFunds = selectedMethod === 'kwenda_wallet' && 
    wallet && wallet.balance < totalAmount;

  const quickTips = [0, 500, 1000, 2000];

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // Simuler le processus de paiement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentData = {
        bookingId: bookingData.id,
        method: selectedMethod,
        amount: totalAmount,
        tip: tipAmount,
        rating,
        feedback: feedback.trim() || null,
        timestamp: new Date().toISOString()
      };

      onPaymentComplete(paymentData);
      
      toast.success(
        selectedMethod === 'cash' 
          ? 'Paiement en espèces confirmé' 
          : 'Paiement effectué avec succès'
      );
      
      onClose();
    } catch (error) {
      toast.error('Erreur lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Paiement de la course
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé de la course */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium">Résumé de la course</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Départ</p>
                    <p className="font-medium">{bookingData.pickup.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-secondary mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Arrivée</p>
                    <p className="font-medium">{bookingData.destination.address}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Distance</span>
                <span>{bookingData.distance.toFixed(1)} km</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Durée</span>
                <span>{bookingData.duration}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Chauffeur</span>
                <div className="flex items-center gap-1">
                  <span>{bookingData.driverName}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{bookingData.driverRating}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center font-medium">
                <span>Montant de la course</span>
                <span>{bookingData.actualPrice.toLocaleString()} CDF</span>
              </div>
            </CardContent>
          </Card>

          {/* Évaluation du chauffeur */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium">Évaluer le chauffeur</h3>
              
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-colors"
                  >
                    <Star 
                      className={`h-6 w-6 ${
                        star <= rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Commentaire sur la course (optionnel)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Pourboire */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Pourboire (optionnel)</h3>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {quickTips.map((tip) => (
                  <Button
                    key={tip}
                    variant={tipAmount === tip ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTipAmount(tip)}
                    className="text-xs"
                  >
                    {tip === 0 ? 'Aucun' : `${tip.toLocaleString()}`}
                  </Button>
                ))}
              </div>

              <Input
                type="number"
                placeholder="Montant personnalisé"
                value={tipAmount || ''}
                onChange={(e) => setTipAmount(Number(e.target.value) || 0)}
              />
            </CardContent>
          </Card>

          {/* Méthode de paiement */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium">Méthode de paiement</h3>
              
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  const isWallet = method.id === 'kwenda_wallet';
                  
                  return (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'ring-2 ring-primary' 
                          : 'hover:bg-muted/20'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-${method.color}/10`}>
                            <Icon className={`h-4 w-4 text-${method.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{method.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {method.description}
                            </p>
                            {isWallet && wallet && (
                              <p className="text-xs text-primary">
                                Solde: {wallet.balance.toLocaleString()} CDF
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {hasInsufficientFunds && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    Solde insuffisant. Veuillez recharger votre portefeuille ou choisir un autre moyen de paiement.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total et confirmation */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Course</span>
                  <span>{bookingData.actualPrice.toLocaleString()} CDF</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Pourboire</span>
                    <span>{tipAmount.toLocaleString()} CDF</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-base">
                  <span>Total</span>
                  <span>{totalAmount.toLocaleString()} CDF</span>
                </div>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={processing || hasInsufficientFunds}
                className="w-full h-12"
                size="lg"
              >
                {processing ? (
                  'Traitement en cours...'
                ) : selectedMethod === 'cash' ? (
                  'Confirmer paiement espèces'
                ) : (
                  `Payer ${totalAmount.toLocaleString()} CDF`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}