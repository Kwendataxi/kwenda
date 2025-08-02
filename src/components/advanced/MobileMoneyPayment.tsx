import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Smartphone, Shield, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileMoneyPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

type Provider = 'airtel' | 'mpesa' | 'orange';

const MobileMoneyPayment: React.FC<MobileMoneyPaymentProps> = ({
  amount,
  onSuccess,
  onCancel
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<Provider>('airtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');

  const providers = [
    {
      id: 'airtel' as Provider,
      name: 'Airtel Money',
      logo: '📱',
      color: 'bg-red-500',
      prefix: '+243 97'
    },
    {
      id: 'mpesa' as Provider,
      name: 'M-Pesa',
      logo: '💰',
      color: 'bg-green-500',
      prefix: '+243 99'
    },
    {
      id: 'orange' as Provider,
      name: 'Orange Money',
      logo: '🧡',
      color: 'bg-orange-500',
      prefix: '+243 98'
    }
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    setStep('processing');

    // Simulate API call to mobile money provider
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const transactionId = `MM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      setStep('success');
      
      setTimeout(() => {
        onSuccess(transactionId);
        toast({
          title: t('common.success'),
          description: `Paiement de ${amount} FC effectué avec succès`,
        });
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      setStep('select');
      toast({
        title: t('common.error'),
        description: 'Erreur lors du paiement. Veuillez réessayer.',
        variant: 'destructive'
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF'
    }).format(amount);
  };

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('common.success')}</h3>
          <p className="text-muted-foreground">
            Paiement de {formatAmount(amount)} effectué avec succès
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Traitement en cours...</h3>
          <p className="text-muted-foreground mb-4">
            Veuillez suivre les instructions sur votre téléphone
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Maximum 2 minutes</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>{t('payment.mobile_money')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-2xl font-bold">{formatAmount(amount)}</p>
          <p className="text-sm text-muted-foreground">Montant à payer</p>
        </div>

        <div className="space-y-4">
          <Label>Choisir un opérateur</Label>
          <RadioGroup
            value={selectedProvider}
            onValueChange={(value) => setSelectedProvider(value as Provider)}
          >
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50">
                <RadioGroupItem value={provider.id} id={provider.id} />
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-10 h-10 rounded-full ${provider.color} flex items-center justify-center text-white text-lg`}>
                    {provider.logo}
                  </div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">{provider.prefix}xxxxxxx</p>
                  </div>
                </div>
                <Badge variant="secondary">Disponible</Badge>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('payment.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder={providers.find(p => p.id === selectedProvider)?.prefix + 'xxxxxxx'}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Paiement sécurisé via {providers.find(p => p.id === selectedProvider)?.name}</span>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={!phoneNumber || isProcessing}
            className="flex-1"
          >
            {isProcessing ? t('common.loading') : t('payment.confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileMoneyPayment;