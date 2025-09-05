import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePromoCode } from '@/hooks/usePromoCode';
import { Tag, Percent, Gift, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromoCodePanelProps {
  open: boolean;
  onClose: () => void;
}

export const PromoCodePanel: React.FC<PromoCodePanelProps> = ({ open, onClose }) => {
  const { 
    validatePromoCode, 
    availableCodes, 
    userUsage, 
    getPersonalizedCodes,
    isLoading 
  } = usePromoCode();
  
  const { toast } = useToast();
  const [newCode, setNewCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [personalizedCodes, setPersonalizedCodes] = useState<any[]>([]);

  React.useEffect(() => {
    if (open) {
      getPersonalizedCodes().then(setPersonalizedCodes).catch(console.error);
    }
  }, [open, getPersonalizedCodes]);

  const handleValidateCode = async () => {
    if (!newCode.trim()) return;
    
    setValidating(true);
    try {
      const result = await validatePromoCode(newCode, 5000, 'transport');
      
      if (result.isValid) {
        toast({
          title: "Code promo valide !",
          description: `Réduction de ${result.discountAmount} CDF disponible`,
        });
      } else {
        toast({
          title: "Code promo invalide",
          description: "Ce code n'est pas valide ou a expiré",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de valider le code promo",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} CDF`;

  const getDiscountText = (code: any) => {
    if (code.discount_type === 'percentage') {
      return `${code.discount_value}%`;
    }
    return formatCurrency(code.discount_value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-congo-accent" />
            Codes Promo & Réductions
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Disponibles</TabsTrigger>
            <TabsTrigger value="personalized">Personnalisés</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Entrer un code promo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Entrez votre code promo"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleValidateCode}
                    disabled={!newCode.trim() || validating}
                    className="congo-gradient text-white"
                  >
                    {validating ? 'Vérification...' : 'Valider'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {availableCodes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun code promo disponible</p>
                      <p className="text-sm">Revenez plus tard pour de nouvelles offres !</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                availableCodes.map((code) => (
                  <Card key={code.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-mono">
                              {code.code}
                            </Badge>
                            <Badge variant="outline" className="text-congo-primary">
                              {getDiscountText(code)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {code.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expire le {new Date(code.valid_until).toLocaleDateString()}
                            </span>
                            {code.min_order_amount > 0 && (
                              <span>
                                Min. {formatCurrency(code.min_order_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setNewCode(code.code)}
                        >
                          Utiliser
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="personalized" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Offres Personnalisées
                </CardTitle>
              </CardHeader>
              <CardContent>
                {personalizedCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune offre personnalisée</p>
                    <p className="text-sm">Utilisez plus souvent l'app pour débloquer des offres exclusives !</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {personalizedCodes.map((code, index) => (
                      <Card key={index} className="congo-gradient-subtle">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="default" className="mb-2 bg-congo-primary">
                                EXCLUSIF
                              </Badge>
                              <p className="font-medium">{code.title}</p>
                              <p className="text-sm text-muted-foreground">{code.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-congo-primary">
                                {code.discount}
                              </div>
                              <Button size="sm" className="mt-2">
                                Activer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique d'utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                {userUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun code utilisé</p>
                    <p className="text-sm">Vos codes utilisés apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userUsage.map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium font-mono">{usage.promo_codes?.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(usage.used_at).toLocaleDateString()} - 
                            Économisé: {formatCurrency(usage.discount_amount)}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};